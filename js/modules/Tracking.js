import * as THREE from "three";
import { FilesetResolver, HandLandmarker, PoseLandmarker, DrawingUtils } from "@mediapipe/tasks-vision";
import Common from "./Common";

class Tracking {
    constructor() {
        this.handLandmarker = null;
        this.poseLandmarker = null;
        this.landmarks = [];
        this.video = null;
        
        this.bodyKeys =  [
            "head", "leftHand", "rightHand", "center", 
            "leftShoulder", "rightShoulder", "leftHeap","rightHeap", "leftFoot", "rightFoot",
            "leftElbow", "rightElbow", "leftKnee", "rightKnee"
        ];
        this.people = [];  // -> 각 사람(person)의 bodyKey 데이터를 담음
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
    
    async init( video) {
        this.running = false;
        this.video = video;
        
        const fileset = await FilesetResolver.forVisionTasks(
            "/mediapipe/wasm"
        );

        // 이전에 생성된 인스턴스가 있다면 안전하게 close 합니다.
        if (this.poseLandmarker) {
            this.poseLandmarker.close();
        }

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
            if (!this.running) return; // destroy()가 호출되면 루프가 멈춥니다.
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
            this.people = [];
            this.landmarks = [];
            return;
        }
        this.landmarks = poseResult.landmarks;
        

        // 감지된 사람 수만큼 순회
        this.people = poseResult.landmarks.map((personLandmarks, personIndex) => {
            // 이전에 추적되던 사람이 있다면 해당 데이터 재사용, 없다면 새로 생성
            const personData = this.people[personIndex] || this.createPersonData();

            if (!personLandmarks || personLandmarks.length < 33) return personData;

            // 주요 랜드마크 추출
            const head = personLandmarks[0];
            const leftHand = personLandmarks[15];
            const rightHand = personLandmarks[16];
            const leftShoulder = personLandmarks[11];
            const rightShoulder = personLandmarks[12];
            const leftHeap = personLandmarks[23];
            const rightHeap = personLandmarks[24];
            const leftFoot = personLandmarks[29];
            const rightFoot = personLandmarks[30];

            // 중간 지점 계산
            const neckX = (leftShoulder.x + rightShoulder.x) / 2;
            const neckY = (leftShoulder.y + rightShoulder.y) / 2;
            const heapX = (leftHeap.x + rightHeap.x) / 2;
            const heapY = (leftHeap.y + rightHeap.y) / 2;

            const leftElbow = personLandmarks[13];
            const rightElbow = personLandmarks[14];
            const leftKnee = personLandmarks[25];
            const rightKnee = personLandmarks[26];

            // 각 신체 부위 좌표 업데이트
            this.updatePartCoords(personData.head, head.x, head.y);
            this.updatePartCoords(personData.leftHand, leftHand.x, leftHand.y);
            this.updatePartCoords(personData.rightHand, rightHand.x, rightHand.y);
            this.updatePartCoords(personData.leftShoulder, leftShoulder.x, leftShoulder.y);
            this.updatePartCoords(personData.rightShoulder, rightShoulder.x, rightShoulder.y);
            this.updatePartCoords(personData.center, neckX, neckY);
            this.updatePartCoords(personData.leftHeap, leftHeap.x , leftHeap.y);
            this.updatePartCoords(personData.rightHeap, rightHeap.x, rightHeap.y);
            this.updatePartCoords(personData.leftFoot, leftFoot.x, leftFoot.y);
            this.updatePartCoords(personData.rightFoot, rightFoot.x, rightFoot.y);

            this.updatePartCoords(personData.leftElbow, leftElbow.x, leftElbow.y);
            this.updatePartCoords(personData.rightElbow, rightElbow.x, rightElbow.y);
            this.updatePartCoords(personData.leftKnee, leftKnee.x, leftKnee.y);
            this.updatePartCoords(personData.rightKnee, rightKnee.x, rightKnee.y);
            
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

        const screenX = Math.floor((1 - x) * Common.width);
        const screenY = Math.floor(y * Common.height);

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
        this.people.forEach(person => {
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
        return this.people;
    }

    getLandmarks() {
        // landmarks가 정의되지 않았으면 빈 배열 반환
        if (!this.landmarks || !Array.isArray(this.landmarks)) {
            return [];
        }
        return this.landmarks;
    }

    /**
     * ★★★ 추가된 함수 ★★★
     * MediaPipe 인스턴스와 추적 루프를 안전하게 종료합니다.
     */
    destroy() {
        console.log("Destroying Tracking (Multi-person)...");
        // 1. requestAnimationFrame 루프를 중단시킵니다.
        this.running = false;

        // 2. MediaPipe PoseLandmarker 인스턴스의 리소스를 해제합니다.
        if (this.poseLandmarker) {
            this.poseLandmarker.close();
            this.poseLandmarker = null;
        }
        
        // 3. 데이터 배열을 초기화합니다.
        this.people = [];
        this.landmarks = [];
    }
}

export default new Tracking();