import * as THREE from "three";
import { FilesetResolver, HandLandmarker, PoseLandmarker, DrawingUtils } from "@mediapipe/tasks-vision";
import Common from "./Common";

class Tracking {
    constructor() {
        this.handLandmarker = null;
        this.poseLandmarker = null;
        this.landmarks = [];
        this.video = null;

        this.bodyKeys = [
            "head", "leftHand", "rightHand", "center",
            "leftShoulder", "rightShoulder", "leftHeap", "rightHeap", "leftFoot", "rightFoot",
            "leftElbow", "rightElbow", "leftKnee", "rightKnee"
        ];
        this.people = [];  // -> 각 사람(person)의 bodyKey 데이터를 담음
        this.running = false;

        /**
         * ★ Web Worker 관련 속성 추가
         */
        this.worker = null;
        // Worker가 현재 프레임을 처리 중인지 나타내는 플래그 (Back-pressure)
        this.isWorkerBusy = false;

        // ★★★ (추가) Worker 준비 상태 플래그
        this.isWorkerReady = false;
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

    /**
     * ★★★ init 수정 ★★★
     * MediaPipe 초기화 대신 Web Worker를 생성합니다.
     */
    async init(video) {
        this.running = false;
        this.video = video;

        // 기존 Worker가 있다면 종료
        if (this.worker) {
            this.worker.terminate();
        }

        // 1. Web Worker 생성 (ES Module 지원)
        // 'tracking.worker.js'는 실제 파일 경로여야 합니다.
        // ★★★ 수정된 부분 ★★★
        // 'type: 'module'' 옵션을 제거합니다.
        this.worker = new Worker(new URL('./tracking.worker.js', import.meta.url), {
            type: 'classic' // 워커 내부에서 import 구문을 사용하려면 'module' 타입이 필요
        });

        // ★★★ (수정) Worker 메시지 핸들러
        // 2. Worker로부터 메시지(결과) 수신
        this.worker.onmessage = (event) => {
            const { type, payload } = event.data; // 표준화된 형식 사용

            if (type === 'READY') {
                console.log("Main: Worker is ready.");
                this.isWorkerReady = true;
                this.startTracking(); // Worker가 준비된 후에만 추적 시작
            } else if (type === 'RESULT') {
                const poseResult = payload;
                if (poseResult) {
                    this.handlePoseResult(poseResult);
                }
                // Worker가 다음 프레임을 받을 준비가 되었음을 표시
                this.isWorkerBusy = false;
            }
            // ★★★ (추가) Worker로부터 구체적인 에러 메시지 수신
            else if (type === 'ERROR') {
                console.error("Worker reported an error:", payload.message, payload.stack);
                // 에러 발생 시에도 Worker는 작업을 마친 것으로 간주
                this.isWorkerBusy = false;
            }
        };

        this.worker.onerror = (err) => {
            console.error("Worker error:", err);
            this.isWorkerBusy = false;
        };

        // 3. Worker에 초기화 메시지 전송 (Wasm/모델 경로 전달)
        this.worker.postMessage({
            type: 'INIT',
            wasmPath: '/mediapipe/wasm',
            modelPath: '/mediapipe/models/pose_landmarker_lite.task'
        });

        // ★★★ (수정) init에서 startTracking() 호출 제거
        // this.startTracking();
    }
    /**
     * 비디오 프레임에서 포즈 추적을 시작합니다.
     */
    startTracking() {
        if (this.running) return;
        this.running = true;

        // 성능 향상을 위해 저해상도 캔버스 사용
        // const offscreen = document.createElement("canvas");
        const scale = 0.5;
        // offscreen.width = this.video.videoWidth * scale;
        // offscreen.height = this.video.videoHeight * scale;
        const offscreen = new OffscreenCanvas(this.video.videoWidth * scale, this.video.videoHeight * scale);
        const offctx = offscreen.getContext("2d");

        let lastDetect = 0;
        const DETECT_INTERVAL = 1000 / 500; // 15 fps

        const process = async (ts) => {
            if (!this.running) return;

            // 1. Worker가 바쁘면(이전 프레임 처리 중) 이번 프레임은 건너뜀
            if (!this.isWorkerBusy && (ts - lastDetect) > DETECT_INTERVAL) {
            this.isWorkerBusy = true;
            lastDetect = ts;

            offctx.drawImage(this.video, 0, 0, offscreen.width, offscreen.height);
            const frame = await createImageBitmap(offscreen);

            this.worker.postMessage({ type: "DETECT", frame, timestamp: ts }, [frame]);
        }

            // 5. 메인 스레드는 즉시 다음 프레임 루프를 예약 (차단 없음)
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
            this.updatePartCoords(personData.leftHeap, leftHeap.x, leftHeap.y);
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

        partData.coords.set((1 - x) * 2 - 1, -(y * 2 - 1));
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