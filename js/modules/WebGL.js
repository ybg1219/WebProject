import * as THREE from "three";
import Common from "./Common";
import Output from "./Output";
import Mouse from "./Mouse";
import HandTracking from "./HandTracking";
import BodyTracking from "./BodyTracking";

export default class Webgl{
    constructor(props){
        this.props = props; // document.body를 받아옴.

        Common.init();
        Mouse.init();
        HandTracking.init();
        BodyTracking.init();

        this.init();
        this.loop();
        this.videoMesh;

        window.addEventListener("resize", this.resize.bind(this)); // 이벤트 타입과 콜백함수
    }

    init(){
        this.props.$wrapper.prepend(Common.renderer.domElement); // document.body의 맨 앞에 추가됨. append와 반대.
        this.output = new Output();
        
        this.showCam();
    }

    resize(){
        Common.resize();
        this.output.resize();
        
        this.showCam();
    }

    render(){
        // console.log("web gl render");
        // console.trace();

        Mouse.update();
        HandTracking.update();
        BodyTracking.update();
        Common.update();
        this.output.update();

    }

    loop(){
        this.render();
        requestAnimationFrame(this.loop.bind(this)); // 콜백함수를 인자로 받음.
    }

    showCam(){

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

                // 이전 메쉬 삭제
                if (this.videoMesh) {
                    this.output.scene.remove(this.videoMesh);
                    this.videoMesh.geometry.dispose();
                    this.videoMesh.material.dispose();
                }
                const vidScale = 0.0003; // 영상 사이즈 조절. 
                console.log(Common.width*vidScale, Common.height*vidScale)
                const geometry = new THREE.PlaneGeometry(Common.width*vidScale/2, Common.height*vidScale);
                const material = new THREE.MeshBasicMaterial({ map: this.videoTexture });
                const mesh = new THREE.Mesh(geometry, material);
                mesh.scale.x = -1;
                mesh.position.set(0, 0.8, 0); // y축으로 위로 올림
                
                this.videoMesh = mesh;
                this.output.scene.add(this.videoMesh);
            }
        })
        .catch(err => {
            console.error('웹캠 접근 실패:', err);
            throw err;
        });
    }
}