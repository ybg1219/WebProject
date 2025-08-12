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

        // 공통인 렌더러 요소들 초기화
        Common.init();

        // 비디오와 캔버스 초기화
        VideoManager.init(this.props.$wrapper, Common.width, Common.height);
        CanvasManager.init(this.props.$wrapper, Common.width, Common.height);
        
        // register resize
        window.addEventListener("resize", this.resize.bind(this)); // 이벤트 타입과 콜백함수

        this.init(); // 비동기 초기화 함수 분리
        this.loop();
    }

    async init() {
        // 렌더러 dom 에 추가
        this.props.$wrapper.prepend(Common.renderer.domElement); // document.body의 맨 앞에 추가됨. append와 반대.

        // fps 확인 dom 에 추가
        this.stats = new Stats(); // 프레임 확인용.
        document.body.appendChild(this.stats.dom);

        // 시뮬레이션 아웃풋 초기화 및 입력 모듈 초기화
        this.output = new Output();
        //await VideoManager.startCamera();
        await VideoManager.loadVideoFile("/videos/Demo.mp4"); // 여기에 mp4 파일 경로


        Mouse.init();
        // BodyTracking.init();
        Tracking.init();   // 카메라 시작 후 실행해야함.
    }
    

    resize(){
        Common.resize();
        this.output.resize();

        VideoManager.setSize( Common.width, Common.height);
        CanvasManager.setSize( Common.width, Common.height);

        // this.showCam();
    }

    render(){
        Mouse.update();
        // HandTracking.update();
        // BodyTracking.update();
        Tracking.update();
        Common.update();
        this.output.update();
        
        // CanvasManager.drawPoint(VideoManager.getElement(), BodyTracking.landmarks );
        // CanvasManager.drawLine(VideoManager.getElement(), BodyTracking.landmarks );
        // CanvasManager.drawLine(VideoManager.getElement(), Tracking.landmarks );
        CanvasManager.drawLine(VideoManager.getElement(), Tracking.getLandmarks() );
    }

    loop(){
        if (this.stats) this.stats.begin();
        this.render();
        if (this.stats) this.stats.end();
        requestAnimationFrame(this.loop.bind(this)); // 콜백함수를 인자로 받음.
    }

}