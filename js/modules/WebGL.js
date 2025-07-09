import * as THREE from "three";
import Common from "./Common";
import Output from "./Output";
import Mouse from "./Mouse";
import HandTracking from "./HandTracking";
import BodyTracking from "./BodyTracking";
import VideoManager from "./VideoManager";
import CanvasManager from "./CanvasManager";

export default class Webgl{
    constructor(props){
        this.props = props; // document.body를 받아옴.

        Common.init();
        Mouse.init();
        HandTracking.init();
        BodyTracking.init();
        VideoManager.init(this.props.$wrapper, Common.width, Common.height);
        CanvasManager.init(this.props.$wrapper, Common.width, Common.height);
        
        window.addEventListener("resize", this.resize.bind(this)); // 이벤트 타입과 콜백함수

        this.init();
        this.loop();
        // this.videoMesh;

    }

    async init(){
        this.props.$wrapper.prepend(Common.renderer.domElement); // document.body의 맨 앞에 추가됨. append와 반대.

        this.stats = new Stats(); // 프레임 확인용.
        document.body.appendChild(this.stats.dom);

        this.output = new Output();
        await VideoManager.startCamera();
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
        HandTracking.update();
        BodyTracking.update();
        Common.update();
        this.output.update();
        // 테스트 용
        // const landmarks = [
        //     { x: 0.5, y: 0.5 },  // 중앙
        //     { x: 0.0, y: 0.0 },
        //     { x: 0.7, y: 0.4 },
        //     { x: 1.0, y: 1.0}
            
        // ];
        CanvasManager.drawPoint(VideoManager.getElement(), BodyTracking.landmarks );
        CanvasManager.drawLine(VideoManager.getElement(), BodyTracking.landmarks );
    }

    loop(){
        if (this.stats) this.stats.begin();
        this.render();
        if (this.stats) this.stats.end();
        requestAnimationFrame(this.loop.bind(this)); // 콜백함수를 인자로 받음.
    }

}