// import * as THREE from "three";
import Common from "./Common";
import Output from "./Output";
import Mouse from "./Mouse";
// import HandTracking from "./HandTracking";
// import BodyTracking from "./BodyTracking";
import Tracking from "./Tracking";
import VideoManager from "./VideoManager";
import CanvasManager from "./CanvasManager";

export default class Webgl{
    constructor(props){
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

        // 시뮬레이션 아웃풋 초기화 및 입력 모듈 초기화
        // await VideoManager.startCamera();
        await VideoManager.loadVideoFile("videos/house.mp4"); // 여기에 mp4 파일 경로
        // await VideoManager.loadVideoFile("./videos/house.mp4");

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
    }
    

    resize(){
        if (this._destroyed) return;

        Common.resize();
        if (this.output) this.output.resize();

        VideoManager.setSize( Common.width, Common.height);
        CanvasManager.setSize( Common.width, Common.height);
    }

    render(){
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

    loop(){
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