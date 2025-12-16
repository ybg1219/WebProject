// import * as THREE from "three";
import Common from "./Common";
import Output from "./Output";
import Mouse from "./Mouse";
// import HandTracking from "./HandTracking";
// import BodyTracking from "./BodyTracking";
import Tracking from "./Tracking";
import VideoManager from "./VideoManager";
import CanvasManager from "./CanvasManager";

export default class Webgl {
    constructor(props) {
        this.props = props; // document.body를 받아옴.
        this._destroyed = false;

        // --- 시뮬레이션 옵션 ---
        this.options = {
            isMultiPerson: true, // 이 값을 false로 바꾸면 단일 모드로 실행됩니다.
        };

        // 공통인 렌더러 요소들 초기화
        Common.init();

        // 비디오와 캔버스 초기화
        VideoManager.init(this.props.$wrapper, Common.width, Common.height);
        CanvasManager.init(this.props.$wrapper, Common.width, Common.height);

        // requestAnimationFrame ID 저장을 위해 추가
        this.animationFrameId = null;
        // 이벤트 리스너 제거를 위해 bind된 함수를 변수에 저장
        this.resizeHandler = this.resize.bind(this);


        this.init().then(() => {
            if (!this._destroyed) {
                this.loop();
            }
        });

        // register resize
        window.addEventListener("resize", this.resize.bind(this)); // 이벤트 타입과 콜백함수

    }

    async init() {
        // 렌더러 dom 에 추가
        this.props.$wrapper.prepend(Common.renderer.domElement); // document.body의 맨 앞에 추가됨. append와 반대.

        // fps 확인 dom 에 추가
        this.stats = new Stats(); // 프레임 확인용.
        document.body.appendChild(this.stats.dom);

        // {process.env.PUBLIC_URL}확인
        console.log("PUBLIC_URL:", process.env.PUBLIC_URL);

        // 시뮬레이션 아웃풋 초기화 및 입력 모듈 초기화
        //await VideoManager.startCamera();
        // await VideoManager.loadVideoFile("/videos/house.mp4"); // 여기에 mp4 파일 경로
        const videoPath = `${process.env.PUBLIC_URL}videos/image.mp4`;
        await VideoManager.loadVideoFile(videoPath);

        Mouse.init();
        // --- 옵션에 따라 적절한 트래커를 초기화하고 activeTracker에 할당 ---
        if (this.options.isMultiPerson) {
            console.log("Initializing Multi-person Tracker");
            this.activeTracker = Tracking;
        } else {
            console.log("Initializing Single-person Tracker");
            this.activeTracker = BodyTracking;
        }
        await this.activeTracker.init(VideoManager.getElement()); // 활성화된 트래커만 초기화

        // Output(FluidSimulation)에 활성화된 트래커 인스턴스를 전달합니다.
        this.output = new Output({
            activeTracker: this.activeTracker,
            options: this.options
        });

        // [로직 추가] 버튼 클릭 이벤트 리스너
        const enableWebcamBtn = this.props.$wrapper.querySelector('#btn-enable-webcam');
        let isWebcamActive = false; // 현재 상태 추적 변수

        enableWebcamBtn.addEventListener('click', async () => {
            try {
                let videoElement = VideoManager.getElement();

                if (!isWebcamActive) {
                    // --- 켜기 (ON) ---
                    console.log("웹캠 켜기 시도...");

                    // 2. 투명도를 1로 설정 (보이게 하기)
                    if (typeof VideoManager.setVideoOpacity === 'function') {
                        VideoManager.setVideoOpacity('0.4');
                    }
                    // 3. 버튼 상태 업데이트 (끄기 모드로 전환)
                    // [중요] disabled = true를 하지 않습니다!
                    isWebcamActive = true;
                    enableWebcamBtn.textContent = "웹캠 배경 끄기";
                    enableWebcamBtn.classList.remove('bg-blue-600', 'hover:bg-blue-500');
                    enableWebcamBtn.classList.add('bg-gray-600', 'hover:bg-gray-500');

                } else {
                    // --- 끄기 (OFF) ---
                    console.log("웹캠 배경 끄기 시도...");

                    // 1. 투명도를 0으로 설정하여 숨김
                    if (typeof VideoManager.setVideoOpacity === 'function') {
                        VideoManager.setVideoOpacity(0);
                    }
                    if (videoElement) {
                        videoElement.style.opacity = '0';
                        videoElement.classList.remove('opacity-100');
                        videoElement.classList.add('opacity-0');
                    }

                    // 2. 버튼 상태 업데이트 (켜기 모드로 전환)
                    isWebcamActive = false;
                    enableWebcamBtn.textContent = "웹캠 배경 켜기";
                    enableWebcamBtn.classList.remove('bg-gray-600', 'hover:bg-gray-500');
                    enableWebcamBtn.classList.add('bg-blue-600', 'hover:bg-blue-500');
                }

            } catch (error) {
                console.error("웹캠 제어 실패:", error);
                // 에러가 났을 때만 버튼을 비활성화합니다.
                enableWebcamBtn.textContent = "웹캠 오류";
                enableWebcamBtn.disabled = true;
                enableWebcamBtn.classList.add('opacity-50', 'cursor-not-allowed');
            }
        });

    }


    resize() {
        if (this._destroyed) return;

        Common.resize();
        if (this.output) this.output.resize();

        VideoManager.setSize(Common.width, Common.height);
        CanvasManager.setSize(Common.width, Common.height);
    }

    render() {
        if (this._destroyed) return;

        Mouse.update();

        // 활성화된 트래커의 update만 호출.
        if (this.activeTracker) {
            this.activeTracker.update();
        }

        Common.update();
        this.output.update();

        // 랜드마크 그리기
        const landmarks = this.activeTracker ? (this.activeTracker.getLandmarks ? this.activeTracker.getLandmarks() : this.activeTracker.landmarks) : [];
        if (landmarks && landmarks.length > 0) {
            CanvasManager.drawLine(VideoManager.getElement(), landmarks);
        }
    }

    loop() {
        if (this._destroyed) return;

        if (this.stats) this.stats.begin();
        this.render();
        if (this.stats) this.stats.end();
        requestAnimationFrame(this.loop.bind(this)); // 콜백함수를 인자로 받음.
    }

    /**
     * WebGL 인스턴스의 모든 리소스를 정리하는 함수
     */
    destroy() {
        // 중복 호출 방지
        if (this._destroyed) {
            console.warn("WebGL이 이미 destroy되었습니다.");
            return;
        }
        console.log("WebGL 인스턴스를 정리합니다...");

        try {
            // 1. 애니메이션 루프 중단
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            }

            // 2. 이벤트 리스너 제거
            window.removeEventListener("resize", this.resizeHandler);

            // 3. Stats.js DOM 요소 제거
            if (this.stats && this.stats.dom.parentNode) {
                this.stats.dom.parentNode.removeChild(this.stats.dom);
            }

            // 4. Output (Simulation) 연쇄 정리
            if (this.output && this.output.destroy) {
                this.output.destroy();
            }

            // 5. VideoManager 정리
            VideoManager.destroy();

            // 6. Tracker 정리
            if (this.activeTracker && this.activeTracker.destroy) {
                this.activeTracker.destroy();
            }

            // 7. 렌더러 DOM 요소 제거
            if (Common.renderer.domElement.parentNode) {
                Common.renderer.domElement.parentNode.removeChild(Common.renderer.domElement);
            }

        } catch (e) {
            console.error("WebGL 리소스 해제 중 오류 발생:", e);
        } finally {
            // 8. 참조 해제
            this.output = null;
            this.activeTracker = null;
            this.stats = null;
            this.props = null; // $wrapper 참조 해제
            this._destroyed = true;
        }
    }
}