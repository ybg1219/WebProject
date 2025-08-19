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
        
        this.bodyKeys = ["head", "leftHand", "rightHand", "center", "heap", "leftFoot", "rightFoot"];

        //this.handsData = [this.createData(), this.createData()];
        this.bodysData = [ ] // head, left, right, center, heap, left foot, rightfoot

        this.peopleData = [];  // -> 각 사람(person)의 bodyKey 데이터를 담음

        this.running = false;
    }

    /**
     * 신체 부위 하나의 데이터 구조를 생성합니다.
     * @returns {{coords: THREE.Vector2, coords_old: THREE.Vector2, diff: THREE.Vector2, timer: number, moved: boolean}}
     */
    createPartData() {
        return {
            coords: new THREE.Vector2(), // 현재 좌표
            coords_old: new THREE.Vector2(), // 이전 프레임 좌표
            diff: new THREE.Vector2(), // 좌표 변화량
            timer: null, // 움직임 감지를 위한 타이머
            moved: false // 움직임 여부
        };
    }

    /**
     * 한 사람(person)의 전체 신체 데이터 구조를 생성합니다.
     * @returns {Object.<string, {coords: THREE.Vector2, coords_old: THREE.Vector2, diff: THREE.Vector2, timer: number, moved: boolean}>}
     */
    createPersonData() {
        const person = {};
        this.bodyKeys.forEach(key => {
            person[key] = this.createPartData();
        });
        return person;
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
            runningMode: "VIDEO",
            numPoses: 2
        });

        this.startTracking();
    }
    /**
     * 비디오 프레임에서 포즈 추적을 시작합니다.
     */
    startTracking() {
        if (this.running) return;
        this.running = true;

        // 성능 향상을 위해 저해상도 캔버스 사용
        const offscreen = document.createElement("canvas");
        const scale = 0.5;
        offscreen.width = this.video.videoWidth * scale;
        offscreen.height = this.video.videoHeight * scale;
        const offctx = offscreen.getContext("2d");

        const process = async () => {
            if (!this.running) return;

            const now = performance.now();
            offctx.drawImage(this.video, 0, 0, offscreen.width, offscreen.height);
            
            // 비디오 프레임에서 포즈 감지
            const result = await this.poseLandmarker.detectForVideo(offscreen, now);
            this.handlePoseResult(result);

            requestAnimationFrame(process);
        };

        process();
    }

    /**
     * 감지된 포즈 결과를 처리하여 각 사람의 데이터를 업데이트합니다.
     * @param {Object} poseResult - MediaPipe PoseLandmarker의 감지 결과
     */
    handlePoseResult(poseResult) {
        if (!poseResult.landmarks || poseResult.landmarks.length === 0) {
            return;
        }
        this.landmarks = poseResult.landmarks;
        

        // 감지된 사람 수만큼 순회
        this.peopleData = poseResult.landmarks.map((personLandmarks, personIndex) => {
            // 이전에 추적되던 사람이 있다면 해당 데이터 재사용, 없다면 새로 생성
            const personData = this.peopleData[personIndex] || this.createPersonData();

            if (!personLandmarks || personLandmarks.length < 33) return personData;

            // 주요 랜드마크 추출
            const head = personLandmarks[0];
            const leftHand = personLandmarks[15];
            const rightHand = personLandmarks[16];
            const leftShoulder = personLandmarks[11];
            const rightShoulder = personLandmarks[12];
            const leftHip = personLandmarks[23];
            const rightHip = personLandmarks[24];
            const leftFoot = personLandmarks[29];
            const rightFoot = personLandmarks[30];

            // 중간 지점 계산
            const neckX = (leftShoulder.x + rightShoulder.x) / 2;
            const neckY = (leftShoulder.y + rightShoulder.y) / 2;
            const heapX = (leftHip.x + rightHip.x) / 2;
            const heapY = (leftHip.y + rightHip.y) / 2;

            // 각 신체 부위 좌표 업데이트
            this.updatePartCoords(personData.head, head.x, head.y);
            this.updatePartCoords(personData.leftHand, leftHand.x, leftHand.y);
            this.updatePartCoords(personData.rightHand, rightHand.x, rightHand.y);
            this.updatePartCoords(personData.center, neckX, neckY);
            this.updatePartCoords(personData.heap, heapX, heapY);
            this.updatePartCoords(personData.leftFoot, leftFoot.x, leftFoot.y);
            this.updatePartCoords(personData.rightFoot, rightFoot.x, rightFoot.y);
            
            return personData;
        });
    }

    /**
     * 특정 신체 부위의 좌표와 움직임 상태를 업데이트합니다.
     * @param {Object} partData - 업데이트할 신체 부위 데이터 객체 (예: personData.head)
     * @param {number} x - 랜드마크의 x 좌표 (0.0 ~ 1.0)
     * @param {number} y - 랜드마크의 y 좌표 (0.0 ~ 1.0)
     */
    updatePartCoords(partData, x, y) {
        if (!partData) return;

        // 타이머가 있다면 초기화
        if (partData.timer) clearTimeout(partData.timer);

        // 스크린 좌표로 변환
        const screenX = (1 - x) * Common.width;
        const screenY = y * Common.height;

        // WebGL 좌표계(-1.0 ~ 1.0)로 변환하여 저장
        partData.coords.set((screenX / Common.width) * 2 - 1, -(screenY / Common.height) * 2 + 1);
        partData.moved = true;

        // 100ms 후 움직임 상태를 false로 변경
        partData.timer = setTimeout(() => {
            partData.moved = false;
        }, 100);
    }

    /**
     * 매 프레임마다 호출되어 각 신체 부위의 좌표 변화량을 계산합니다.
     */
    update() {
        this.peopleData.forEach(person => {
            this.bodyKeys.forEach(key => {
                const part = person[key];
                part.diff.subVectors(part.coords, part.coords_old);
                part.coords_old.copy(part.coords);

                // 첫 프레임에서 diff 값이 비정상적으로 커지는 것을 방지
                if (part.coords_old.lengthSq() === 0) {
                    part.diff.set(0, 0);
                }
            });
        });
    }

    /**
     * 추적을 중지합니다.
     */
    stopTracking() {
        this.running = false;
    }

    /**
     * 추적된 모든 사람의 데이터를 반환합니다.
     * @returns {Array<Object>}
     */
    getPeople() {
        return this.peopleData;
    }

    getLandmarks() {
        // landmarks가 정의되지 않았으면 빈 배열 반환
        if (!this.landmarks || !Array.isArray(this.landmarks)) {
            return [];
        }
        return this.landmarks;
    }

    setCoords(data, x, y) {
        if (data.timer) clearTimeout(data.timer);

        data.coords.set((x / Common.width) * 2 - 1, -(y / Common.height) * 2 + 1);
        data.moved = true;

        data.timer = setTimeout(() => {
            data.moved = false;
        }, 100);
    }

    // update() {
    //     // hands
    //     // for (let i = 0; i < this.handsData.length; i++) {
    //     //     const hand = this.handsData[i];
    //     //     hand.diff.subVectors(hand.coords, hand.coords_old);
    //     //     hand.coords_old.copy(hand.coords);
    //     // }
    //     // 전체 bodysData 각 원소별로 diff 계산
    //     this.bodysData.forEach(body => {
    //         body.diff.subVectors(body.coords, body.coords_old);
    //         body.coords_old.copy(body.coords);

    //         // 초기 프레임 등 0,0 일 경우 diff 초기화
    //         if (body.coords_old.x === 0 && body.coords_old.y === 0) {
    //             body.diff.set(0, 0);
    //         }
    //     });
    // }

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