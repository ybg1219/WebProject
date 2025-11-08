// "센서" 모듈: MediaPipe를 실행하고 손 데이터를 EventBus로 발행합니다.

import {
    GestureRecognizer,
    FilesetResolver
} from "@mediapipe/tasks-vision";
import EventBus from '../utils/EventBus.js'; // 1. EventBus 임포트

// 'Click' 제스처로 인식할 최소 점수(score)
const CLICK_SCORE_THRESHOLD = 0.5; // 0.0 ~ 1.0. 50% 이상의 확신

class GestureTracking {
    constructor() {
        this.gestureRecognizer = null;
        this.video = null;
        this.lastVideoTime = -1;
        this.animationFrameId = null;
        this.running = false; // 2. 루프 제어 플래그 추가
    }

    /**
     * 외부에서 현재 모듈의 실행 상태를 확인할 수 있는 getter
     */
    get isActive() {
        return this.running;
    }

    /**
     * MediaPipe GestureRecognizer를 초기화합니다.
     * @param {HTMLVideoElement} videoElement - MediaPipe가 추적할 <video> 요소
     */
    async init(videoElement) {
        if (!videoElement) {
            console.error("Video element가 제공되지 않았습니다.");
            return;
        }
        this.video = videoElement;

        try {
            // MediaPipe 리소스 로드 (WASM 파일)
            const vision = await FilesetResolver.forVisionTasks(
                "./mediapipe/wasm" // WASM 리소스가 복사된 경로
            );

            // GestureRecognizer 생성
            this.gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
                baseOptions: {
                    // 모델 파일(.task)도 정적 파일로 복사해야 합니다.
                    modelAssetPath: `./mediapipe/models/gesture_recognizer.task`,
                    delegate: "GPU"
                },
                runningMode: "VIDEO",
                numHands: 1 // 한 손만 추적 (가상 커서 목적)
            });

            // 비디오가 로드되면 추적 시작
            this.video.addEventListener("loadeddata", () => {
                this.start(); 
            });

        } catch (error) {
            // 초기화 실패 시 명확한 로그 발생
            console.error("----------------------------------------");
            console.error("Tracking.js: MediaPipe 초기화 실패!");
            console.error("WASM 또는 .task 파일 경로(/mediapipe/...)를 확인하세요.");
            console.error("원본 오류:", error);
            console.error("----------------------------------------");
            
            // 에러를 다시 던져서 호출한 곳(예: LandingPage)에서 알 수 있게 함
            throw error; 
        }
    }

    /**
     * 추적 루프를 시작합니다.
     */
    start() {
        if (this.running) return; // 이미 실행 중이면 중복 실행 방지
        this.running = true; // 3. 루프 시작 플래그 설정
        this.predictWebcam();
    }

    /**
     * 추적 루프를 중지합니다.
     */
    stop() {
        this.running = false; // 4. 루프 중지 플래그 설정
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    /**
     * 비디오 프레임마다 제스처와 랜드마크를 예측하는 메인 루프입니다.
     */
    async predictWebcam() {
        // 5. this.running 플래그로 루프 제어
        if (!this.running || !this.gestureRecognizer || !this.video) {
            this.running = false;
            return;
        }

        if (this.video.readyState < 2) {
            this.animationFrameId = requestAnimationFrame(() => this.predictWebcam());
            return;
        }

        //예측 수행
        const results = await this.gestureRecognizer.recognizeForVideo(this.video, performance.now());  
        this.processResults(results); // 랜드마크와 제스처 결과를 처리
        
        
        // 다음 프레임 호출
        this.animationFrameId = requestAnimationFrame(() => this.predictWebcam());
    }

    /**
     * 랜드마크와 제스처 결과를 EventBus로 발행(emit)합니다.
     * @param {Object} results - GestureRecognizer의 결과 객체
     */
    processResults(results) {
        const landmarks = results.landmarks[0]; // 첫 번째 손의 랜드마크
        const gestures = results.gestures[0];   // 첫 번째 손의 제스처

        if (gestures && gestures.length > 0) {
            const topGesture = gestures[0];
            // console.log(`Gesture: ${topGesture.categoryName}, Score: ${topGesture.score.toFixed(2)}`);
            // console.log(`Gesture detected: ${topGesture.categoryName} (score: ${topGesture.score.toFixed(2)})`);
        }

        if (!landmarks) {
            // 손이 감지되지 않으면 '손 사라짐' 이벤트 발행
            EventBus.emit('handLost');
            return;
        }

        // 1. 손 위치 계산
        const IndexBase = landmarks[5]; // 5번 랜드마크 (검지 시작0)
        // 랜드마크는 있으나 indexTip이 없는 예외 상황 방어
        if (!IndexBase) {
            console.warn('GestureTracking: Hand landmarks detected, but indexBase (5) is missing.');
            EventBus.emit('handLost');
            return;
        }

        const screenX = window.innerWidth - (IndexBase.x * window.innerWidth);
        const screenY = IndexBase.y * window.innerHeight;

        // 2. 'Click' 제스처(잡기) 감지
        const clickGesture = gestures?.find(g => g.categoryName === 'Closed_Fist');
        const isGrabbing = (clickGesture && clickGesture.score > CLICK_SCORE_THRESHOLD);

        // 3. (중요) DOM을 직접 제어하는 대신 EventBus로 데이터 발행
        EventBus.emit('handUpdate', {
            x: screenX,
            y: screenY,
            isGrabbing: isGrabbing
        });
    }
}

export default new GestureTracking();
