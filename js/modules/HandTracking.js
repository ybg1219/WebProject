import * as THREE from "three";
import Common from "./Common";
// import { Hands} from "@mediapipe/hands";  // MediaPipe용 Hands
// import { Camera } from "@mediapipe/camera_utils";     // MediaPipe용 Camera

class HandTracking{
    constructor(){
        this.handMoved = false;
        this.coords = new THREE.Vector2();
        this.coords_old = new THREE.Vector2();
        this.diff = new THREE.Vector2();
        this.timer = null;
        this.count = 0;
        this.videoElement = null;
        this.hand = null
    }

    async init(){
        
        this.videoElement = document.getElementById('input_video');
        // 핸드 트래킹 초기화 
        // this.hands = new Hands({
        //     locateFile: (file) => `/node_modules/@mediapipe/hands/${file}`
        //   });

        // CDN 코드
        this.hands = await new Hands({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });
        // 로컬 코드
        // this.hands = new Hands({
        //     locateFile: (file) => `/mediapipe/hands/${file}`
        //   });
        
        console.log("Hand Tracking initialize");
        this.hands.setOptions({
            maxNumHands: 2,
            modelComplexity: 1,
            minDetectionConfidence: 0.7,
            minTrackingConfidence: 0.7
        });

        this.hands.onResults(results => {
            //console.log('onResults');
            // 손 랜드마크 위치 탐색된 경우.
            if (results.multiHandLandmarks && results.multiHandedness) {
                for (let i = 0; i < results.multiHandLandmarks.length; i++) {
                    const landmarks = results.multiHandLandmarks[i];
                    const rawLabel = results.multiHandedness[i].label;
                    const handType = rawLabel === "Right" ? "Left" : "Right"; // 반전된 화면 기준으로 수정
            
                    // 오른손만 빨간 점으로 검지 끝
                    if (handType === "Right") {
                        const indexTip = landmarks[8]; // 검지 끝
                    //   drawHandLandmarks([indexTip], 'red', 10);
                        // console.log(indexTip.x*Common.width, indexTip.y*Common.height);
                        // const x = Math.floor(indexTip.x * Common.width);
                        const x = Math.floor((1 - indexTip.x) * Common.width);
                        const y = Math.floor(indexTip.y * Common.height);
                        this.setCoords(x, y);
                        // console.log(x,y);
                    }
                }   
            }
        });
        this.cameraStart();
    }

    cameraStart(){
        // 카메라 시작
        const camera = new Camera(this.videoElement, {
            onFrame: async () => {
              await this.hands.send({ image: this.videoElement });
            },
            width: Common.width/10,
            height: Common.height/10
          }); 
        camera.start();
    }

    setCoords( x, y ) {
        if(this.timer) clearTimeout(this.timer);
        this.coords.set( ( x / Common.width ) * 2 - 1, - ( y / Common.height ) * 2 + 1 );
        this.handMoved = true;
        this.timer = setTimeout(() => {
            this.handMoved = false;
        }, 100);
    }
    update(){
        this.diff.subVectors(this.coords, this.coords_old);
        this.coords_old.copy(this.coords);

        if(this.coords_old.x === 0 && this.coords_old.y === 0) this.diff.set(0, 0);
    }
}

export default new HandTracking();
