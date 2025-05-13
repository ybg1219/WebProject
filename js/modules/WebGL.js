import * as THREE from "three";
import Common from "./Common";
import Output from "./Output";
import Mouse from "./Mouse";
import HandTracking from "./HandTracking";

export default class Webgl{
    constructor(props){
        this.props = props; // document.body를 받아옴.

        Common.init();
        Mouse.init();
        HandTracking.init();

        this.init();
        this.loop();

        window.addEventListener("resize", this.resize.bind(this)); // 이벤트 타입과 콜백함수
    }

    init(){
        this.props.$wrapper.prepend(Common.renderer.domElement);
        this.output = new Output();
        
        //video 코드
        this.video = document.getElementById('input_video');
        // 생성해서 사용하는 video
        // this.video = document.createElement('video');
        // this.video.autoplay = true;
        // this.video.playsInline = true;
        // this.video.style.display = 'none';
        // document.body.appendChild(this.video);

        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                this.stream = stream;
                this.video.srcObject = stream;

                this.videoTexture = new THREE.VideoTexture(this.video);
                this.videoTexture.minFilter = THREE.LinearFilter;
                this.videoTexture.magFilter = THREE.LinearFilter;
                if (this.videoTexture) {
                    const geometry = new THREE.PlaneGeometry(Common.height/Common.width*0.4, Common.width/Common.width * 0.4);
                    const material = new THREE.MeshBasicMaterial({ map: this.videoTexture });
                    const mesh = new THREE.Mesh(geometry, material);
                    mesh.scale.x = -1;
                    mesh.position.set(0, 0.8, 0); // y축으로 위로 올림
                    this.output.scene.add(mesh);
                }
            })
            .catch(err => {
                console.error('웹캠 접근 실패:', err);
                throw err;
            });
    }

    resize(){
        Common.resize();
        this.output.resize();
        
    }

    render(){
        Mouse.update();
        HandTracking.update();
        Common.update();
        this.output.update();
    }

    loop(){
        this.render();
        requestAnimationFrame(this.loop.bind(this)); // 콜백함수를 인자로 받음.
    }
}