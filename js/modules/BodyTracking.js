import * as THREE from "three";
import Common from "./Common";
import { Pose } from "@mediapipe/pose";
import { Camera } from "@mediapipe/camera_utils";

class BodyTracking {

    constructor() {
        this.landmarks = [];
        this.videoElement = null;
        this.pose = null;

        this.handsData = [ this.createData(), this.createData()];
        
        this.bodysData = [ this.createData(), this.createData()
            ,this.createData(), this.createData(), this.createData(),
            this.createData(),this.createData(),this.createData(), this.createData()
        ] // head, left, right, center, leftshoulder, rightshoulder, heap, leftFoot, rightFoot
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
            locateFile: (file) => {
                return `/mediapipe/pose/${file}`; // 나중에 webpack이 복사해줄 경로
            }
        });

        this.pose.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            enableSegmentation: false,
            minDetectionConfidence: 0.7,
            minTrackingConfidence: 0.7
        });


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

                // body key 에 원하는 키 추가하고, 아래 코드 나중에 for 문으로 변경.
                this.setBodyCoords(0 , head.x, head.y);
                this.setBodyCoords(1, leftHand.x, leftHand.y);
                this.setBodyCoords(2, rightHand.x, rightHand.y);
                this.setBodyCoords(3, neckX, neckY);
                this.setBodyCoords(4, leftShoulder.x , leftShoulder.y);
                this.setBodyCoords(5, rightShoulder.x , rightShoulder.y);
                this.setBodyCoords(6, footX, footY);
                this.setBodyCoords(7, leftFoot.x , leftFoot.y);
                this.setBodyCoords(8, rightFoot.y , rightFoot.y);
            }
        });

        await this.cameraStart();

        console.log("Pose Tracking initialized");
    }

    async cameraStart() {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        this.videoElement.srcObject = stream;

        // 비디오 메타데이터가 로드되어야 videoWidth/Height를 알 수 있습니다.
        await new Promise(resolve => {
            this.videoElement.onloadedmetadata = () => resolve();
        });

        this.videoElement.play();

        // 비디오가 재생되면 매 프레임 추적을 시작합니다.
        const process = async () => {
            await this.pose.send({ image: this.videoElement });
            requestAnimationFrame(process);
        };
        
        process();
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

    /**
     *  @returns {Array<Object>} [{ head: {...}, leftHand: {...}, ... }] 형태의 배열
    */
    getPeople() {
        // bodysData가 비어있으면 아무도 감지되지 않은 것이므로 빈 배열을 반환합니다.
        if (!this.bodysData || this.bodysData.length === 0) {
            return [];
        }

        // bodysData 배열의 각 인덱스가 어떤 신체 부위를 의미하는지 명시합니다.
        // 이 순서는 기존 getBody(index)를 호출하던 순서와 동일해야 합니다.
        const person = {
            head:       this.bodysData[0],
            leftHand:   this.bodysData[1],
            rightHand:  this.bodysData[2],
            center: this.bodysData[3],
            leftShoulder:     this.bodysData[4],
            rightShoulder: this.bodysData[5],
            heap:       this.bodysData[6],
            leftFoot:   this.bodysData[7],
            rightFoot:  this.bodysData[8]
        };

        // 한 명의 데이터를 배열로 감싸서 반환하여, 
        // 다중 트래커의 [person1, person2, ...] 형태와 구조를 일치시킵니다.
        return [person]; 
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
