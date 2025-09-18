import * as THREE from "three";
import Common from "./Common";
import Output from "./Output";
import Mouse from "./Mouse";
import HandTracking from "./HandTracking";
import BodyTracking from "./BodyTracking";
import Tracking from "./Tracking";
import VideoManager from "./VideoManager";
import CanvasManager from "./CanvasManager";

export default class Webgl{
    constructor(props){
        this.props = props; // document.body를 받아옴.

        // --- 시뮬레이션 옵션 ---
        this.options = {
            isMultiPerson: false, // 이 값을 false로 바꾸면 단일 모드로 실행됩니다.
        };

        // 공통인 렌더러 요소들 초기화
        Common.init();

        // 비디오와 캔버스 초기화
        VideoManager.init(this.props.$wrapper, Common.width, Common.height);
        CanvasManager.init(this.props.$wrapper, Common.width, Common.height);
        
        // register resize
        window.addEventListener("resize", this.resize.bind(this)); // 이벤트 타입과 콜백함수

        this.init().then(() => {
            this.loop();
        });
    }

    async init() {
        // 렌더러 dom 에 추가
        this.props.$wrapper.prepend(Common.renderer.domElement); // document.body의 맨 앞에 추가됨. append와 반대.

        // fps 확인 dom 에 추가
        this.stats = new Stats(); // 프레임 확인용.
        document.body.appendChild(this.stats.dom);

        // 시뮬레이션 아웃풋 초기화 및 입력 모듈 초기화
        //await VideoManager.startCamera();
        //await VideoManager.loadVideoFile("/videos/sample.mp4"); // 여기에 mp4 파일 경로


        Mouse.init();
        // --- 옵션에 따라 적절한 트래커를 초기화하고 activeTracker에 할당 ---
        if (this.options.isMultiPerson) {
            console.log("Initializing Multi-person Tracker");
            this.activeTracker = Tracking;
        } else {
            console.log("Initializing Single-person Tracker");
            this.activeTracker = BodyTracking;
        }
        await this.activeTracker.init(); // 활성화된 트래커만 초기화

        // Output(FluidSimulation)에 활성화된 트래커 인스턴스를 전달합니다.
        this.output = new Output({
            activeTracker: this.activeTracker,
            options: this.options
        });
    }
    

    resize(){
        Common.resize();
        this.output.resize();

        VideoManager.setSize( Common.width, Common.height);
        CanvasManager.setSize( Common.width, Common.height);
    }

    render(){
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
        if (this.stats) this.stats.begin();
        this.render();
        if (this.stats) this.stats.end();
        requestAnimationFrame(this.loop.bind(this)); // 콜백함수를 인자로 받음.
    }
}