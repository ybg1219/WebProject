import * as THREE from "three";
import { FilesetResolver, HandLandmarker, PoseLandmarker, DrawingUtils } from "@mediapipe/tasks-vision";
import Common from "./Common";

class Tracking {
    constructor() {
        this.handLandmarker = null;
        this.poseLandmarker = null;
        this.landmarks = [];
        this.video = null;
        this.ctx = null;
        
        this.bodyKeys = ["head", "leftHand", "rightHand", "center", "foot"];

        this.handsData = [this.createData(), this.createData()];
        this.bodysData = [ this.createData(), this.createData()
            ,this.createData(), this.createData(), this.createData()
        ] // head, left, right, center, bottom

        this.running = false;
    }

    createData() {
        return {
            coords: new THREE.Vector2(),
            coords_old: new THREE.Vector2(),
            diff: new THREE.Vector2(),
            timer: null,
            moved: false
        };
    }

    async init() {
        this.video = document.getElementById("input_video");
        
        const fileset = await FilesetResolver.forVisionTasks(
            "/mediapipe/wasm"
        );

        // this.handLandmarker = await HandLandmarker.createFromOptions(fileset, {
        //     baseOptions: {
        //         modelAssetPath: "/models/hand_landmarker.task",
        //         wasmBinaryPath: "/wasm/vision_wasm_internal.wasm",
        //     },
        //     runningMode: "VIDEO",
        //     numHands: 2
        // });

        this.poseLandmarker = await PoseLandmarker.createFromOptions(fileset, {
            baseOptions: {
                modelAssetPath: `/mediapipe/models/pose_landmarker_lite.task`
            },
            runningMode: "VIDEO"
        });

        this.startTracking();
    }

    startTracking() {
        this.running = true;

        const process = async () => {
            if (!this.running) return;

            const now = performance.now();

            // Pose
            const poseResult = await this.poseLandmarker.detectForVideo(this.video, now);
            if (poseResult.landmarks && poseResult.landmarks.length > 0) {
                // const head = poseResult.landmarks[0];
                // const x = (1 - head.x) * Common.width;
                // const y = head.y * Common.height;
                // this.setCoords(this.bodyData, x, y);
                this.landmarks = poseResult.landmarks[0];
                const poseLandmarks = this.landmarks;

                const head = poseLandmarks[0];
                const leftHand = poseLandmarks[15];
                const rightHand = poseLandmarks[16];
                
                const leftShoulder = poseLandmarks[11];
                const rightShoulder = poseLandmarks[12];
                const leftHip = poseLandmarks[23];
                const rightHip = poseLandmarks[24];
                
                const leftFoot = poseLandmarks[29];
                const rightFoot = poseLandmarks[30];

                const avgX = (leftShoulder.x + rightShoulder.x + leftHip.x + rightHip.x) / 4;
                const avgY = (leftShoulder.y + rightShoulder.y + leftHip.y + rightHip.y) / 4;
                const neckX = (leftShoulder.x + rightShoulder.x) / 2;
                const neckY = (leftShoulder.y + rightShoulder.y) / 2;
                const footX = (leftFoot.x + rightFoot.x) / 2;
                const footY = (leftFoot.y + rightFoot.y) / 2;

                // console.log(x,y);
                // this.setCoord(head.x, head.y);

                // body key 에 원하는 키 추가하고, 아래 코드 나중에 for 문으로 변경.
                this.setBodyCoords(this.bodyKeys.indexOf(this.bodyKeys[0]), head.x, head.y);
                this.setBodyCoords(this.bodyKeys.indexOf(this.bodyKeys[1]), leftHand.x, leftHand.y);
                this.setBodyCoords(this.bodyKeys.indexOf(this.bodyKeys[2]), rightHand.x, rightHand.y);
                this.setBodyCoords(this.bodyKeys.indexOf(this.bodyKeys[3]), neckX, neckY);
                this.setBodyCoords(this.bodyKeys.indexOf(this.bodyKeys[4]), footX, footY);
            }

            // Hands
            // const handResult = this.handLandmarker.detectForVideo(this.video, now);
            // if (handResult.landmarks && handResult.landmarks.length > 0) {
            //     handResult.landmarks.forEach((landmarks, i) => {
            //         const indexTip = landmarks[8];
            //         const x = (1 - indexTip.x) * Common.width;
            //         const y = indexTip.y * Common.height;
            //         this.setCoords(this.handsData[i], x, y);
            //     });
            // }

            requestAnimationFrame(process);
        };

        process();
    }

    stopTracking() {
        this.running = false;
    }

    setCoords(data, x, y) {
        if (data.timer) clearTimeout(data.timer);

        data.coords.set((x / Common.width) * 2 - 1, -(y / Common.height) * 2 + 1);
        data.moved = true;

        data.timer = setTimeout(() => {
            data.moved = false;
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

    update() {
        // hands
        // for (let i = 0; i < this.handsData.length; i++) {
        //     const hand = this.handsData[i];
        //     hand.diff.subVectors(hand.coords, hand.coords_old);
        //     hand.coords_old.copy(hand.coords);
        // }
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
}

export default new Tracking();