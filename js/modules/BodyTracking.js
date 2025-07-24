import * as THREE from "three";
import Common from "./Common";
//import { Pose } from "@mediapipe/pose";
import { Camera } from "@mediapipe/camera_utils";

class BodyTracking {

    constructor() {
        this.landmarks = [];
        this.coords = new THREE.Vector2();
        this.coords_old = new THREE.Vector2();
        this.diff = new THREE.Vector2();
        this.moved = false;
        this.timer = null;

        this.videoElement = null;
        this.pose = null;

        // this.bodyKeys = {
        //     HEAD: 0,
        //     LEFT: 1,
        //     RIGHT: 2,
        //     CENTER: 3,
        //     BOTTOM: 4
        // };
        this.bodyKeys = ["head", "leftHand", "rightHand", "center", "foot"];

        this.handsData = [ this.createData(), this.createData()];
        
        this.bodysData = [ this.createData(), this.createData()
            ,this.createData(), this.createData(), this.createData()
        ] // head, left, right, center, bottom
    }

    createData() { // factory pattern
            return {
                coords: new THREE.Vector2(),
                coords_old: new THREE.Vector2(),
                diff: new THREE.Vector2(),
                timer: null,
                moved: false
            };
        }
    

    async init() {
        this.videoElement = document.getElementById('input_video');

        this.pose = new Pose({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
        });

        this.pose.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            enableSegmentation: false,
            minDetectionConfidence: 0.7,
            minTrackingConfidence: 0.7
        });

        console.log("Pose Tracking initialized");

        this.pose.onResults(results => {
            this.landmarks = results.poseLandmarks;
            if (results.poseLandmarks) {
                const head = results.poseLandmarks[0];

                const leftHand = results.poseLandmarks[15];
                const rightHand = results.poseLandmarks[16];

                const leftShoulder = results.poseLandmarks[11];
                const rightShoulder = results.poseLandmarks[12];
                const leftHip = results.poseLandmarks[23];
                const rightHip = results.poseLandmarks[24];

                const leftFoot = results.poseLandmarks[29];
                const rightFoot = results.poseLandmarks[30];

                const avgX = (leftShoulder.x + rightShoulder.x + leftHip.x + rightHip.x) / 4;
                const avgY = (leftShoulder.y + rightShoulder.y + leftHip.y + rightHip.y) / 4;
                const neckX = (leftShoulder.x + rightShoulder.x) / 2;
                const neckY = (leftShoulder.y + rightShoulder.y) / 2;
                const footX = (leftFoot.x + rightFoot.x) / 2;
                const footY = (leftFoot.y + rightFoot.y) / 2;

                // console.log(x,y);
                this.setCoord(head.x, head.y);

                // body key 에 원하는 키 추가하고, 아래 코드 나중에 for 문으로 변경.
                this.setBodyCoords(this.bodyKeys.indexOf(this.bodyKeys[0]), head.x, head.y);
                this.setBodyCoords(this.bodyKeys.indexOf(this.bodyKeys[1]), leftHand.x, leftHand.y);
                this.setBodyCoords(this.bodyKeys.indexOf(this.bodyKeys[2]), rightHand.x, rightHand.y);
                this.setBodyCoords(this.bodyKeys.indexOf(this.bodyKeys[3]), neckX, neckY);
                this.setBodyCoords(this.bodyKeys.indexOf(this.bodyKeys[4]), footX, footY);
                // this.bodyKeys.forEach((key, i) => {
                //     const point = landmarksMap[key];
                //     this.setBodyCoords(i, point.x, point.y);
                // });
            }
        });

        this.cameraStart();
    }

    cameraStart() {
        const camera = new Camera(this.videoElement, {
            onFrame: async () => {
                await this.pose.send({ image: this.videoElement });
            },
            width: Common.width / 10,
            height: Common.height / 10
        });
        camera.start();
    }

    setCoord(x, y) {
        x = Math.floor((1 - x) * Common.width);
        y = Math.floor(y * Common.height);
        if (this.timer) clearTimeout(this.timer);

        this.coords.set((x / Common.width) * 2 - 1, -(y / Common.height) * 2 + 1);
        this.moved = true;

        this.timer = setTimeout(() => {
            this.moved = false;
        }, 100);
    }

    setBodyCoords(index, x, y){
        
        x = Math.floor((1 - x) * Common.width);
        y = Math.floor(y * Common.height);

        const body = this.bodysData[index];
        if (body.timer) clearTimeout(body.timer);// 이전에 돌아가던 타이머 제거.

        body.coords.set((x / Common.width) * 2 - 1, -(y / Common.height) * 2 + 1);
        body.moved = true;

        body.timer = setTimeout(() => {
            body.moved = false;
        }, 100);// 0.1초 동안 움직이지 않으면 다시 false로 바꿈.
    }
    setHandCoords(index, x, y) { // hand용
        
        x = Math.floor((1 - x) * Common.width);
        y = Math.floor(y * Common.height);

        const hand = this.handsData[index];
        if (hand.timer) clearTimeout(hand.timer);// 이전에 돌아가던 타이머 제거.

        hand.coords.set((x / Common.width) * 2 - 1, -(y / Common.height) * 2 + 1);
        hand.moved = true;

        hand.timer = setTimeout(() => {
            hand.moved = false;
        }, 100);// 0.1초 동안 움직이지 않으면 다시 false로 바꿈.
    }

    update() {
        this.diff.subVectors(this.coords, this.coords_old);
        this.coords_old.copy(this.coords);

        if (this.coords_old.x === 0 && this.coords_old.y === 0) {
            this.diff.set(0, 0);
        }

        // 전체 bodysData 각 원소별로 diff 계산
        this.bodysData.forEach(body => {
            body.diff.subVectors(body.coords, body.coords_old);
            body.coords_old.copy(body.coords);

            // 초기 프레임 등 0,0 일 경우 diff 초기화
            if (body.coords_old.x === 0 && body.coords_old.y === 0) {
                body.diff.set(0, 0);
            }
        });
    }

    getBody(index) {
        return {
            //landmarks : this.handsData[index].landmarks,
            coords: this.bodysData[index].coords,
            diff: this.bodysData[index].diff,
            moved: this.bodysData[index].moved
        };
    }
    getWholeBody() {
        // console.log(this.bodysData.map(c => c.coords.clone()));/
        return {
            //landmarks : this.handsData[index].landmarks,
            coords: this.bodysData.map(c => c.coords.clone()), //this.bodyKeys.map((_, i) => this.bodysData[i].coords.clone()),
            diff: this.bodysData.map(d => d.diff.clone()),
            moved: this.bodysData.map(m => m.moved) // coords와 diff는 three.vector2 객체이므로 clone 필요.
        };
    }

    getHand(index) {
        return {
            landmarks : this.handsData[index].landmarks,
            coords: this.handsData[index].coords,
            diff: this.handsData[index].diff,
            moved: this.handMoved[index]
        };
    }
}

export default new BodyTracking();
