import * as THREE from "three";
import Common from "./Common";
import { Hands} from "@mediapipe/hands";  // MediaPipe용 Hands
import { Camera } from "@mediapipe/camera_utils";     // MediaPipe용 Camera

class HandTracking{

    constructor(){
        this.handMoved = [false, false]; // 왼손, 오른손
        this.handsData = [
            {
                landmarks : [],
                coords: new THREE.Vector2(),
                coords_old: new THREE.Vector2(),
                diff: new THREE.Vector2(),
                timer: null
            },
            {
                landmarks : [],
                coords: new THREE.Vector2(),
                coords_old: new THREE.Vector2(),
                diff: new THREE.Vector2(),
                timer: null
            }
        ];
        this.videoElement = null;
        this.hands = null;
    }

    async init(){
        
        this.videoElement = document.getElementById('input_video');
        // 핸드 트래킹 초기화 
        // this.hands = new Hands({
        //     locateFile: (file) => `/node_modules/@mediapipe/hands/${file}`
        //   });

        // CDN 코드
        this.hands = new Hands({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });
        // 로컬 코드
        // this.hands = new Hands({
        //     locateFile: (file) => `/mediapipe/hands/${file}`
        //   });
        
        console.log("Hand Tracking initialize", this.hands);
        this.hands.setOptions({
            maxNumHands: 2,
            modelComplexity: 1,
            minDetectionConfidence: 0.7,
            minTrackingConfidence: 0.7
        });

        this.hands.onResults(results => {
            console.log('onResults', results.multiHandLandmarks);
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
                        console.log(x,y);
                        const handIndex = handType === "Left" ? 0 : 1; // 왼손: 0, 오른손: 1
                        this.setCoords(handIndex, x, y);
                    }                    
                    this.drawHandLandmarks(  landmarks , 'red', 5);
                }   
            }
        });
        this.cameraStart();
    }
    // 랜드마크 그리기 함수
    drawHandLandmarks(landmarks, color, radius) {
      for (const landmark of landmarks) {
        canvasCtx.beginPath();
        canvasCtx.arc(landmark.x * canvasElement.width, landmark.y * canvasElement.height, radius, 0, 2 * Math.PI);
        canvasCtx.fillStyle = color;
        canvasCtx.fill();
      }
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

    setCoords(index, x, y) {
        const hand = this.handsData[index];
        if (hand.timer) clearTimeout(hand.timer);// 이전에 돌아가던 타이머 제거.

        hand.coords.set((x / Common.width) * 2 - 1, -(y / Common.height) * 2 + 1);
        this.handMoved[index] = true;

        hand.timer = setTimeout(() => {
            this.handMoved[index] = false;
        }, 100);// 0.1초 동안 움직이지 않으면 다시 false로 바꿈.
    }
    // setCoords( x, y ) {
    //     if(this.timer) clearTimeout(this.timer); 
    //     this.coords.set( ( x / Common.width ) * 2 - 1, - ( y / Common.height ) * 2 + 1 );
    //     this.handMoved = true;
    //     this.timer = setTimeout(() => {
    //         this.handMoved = false;
    //     }, 100); 
    // }
    update(){
        for (let i = 0; i < this.handsData.length; i++) {
            const hand = this.handsData[i];

            hand.diff.subVectors(hand.coords, hand.coords_old); // diff 계산
            hand.coords_old.copy(hand.coords);  // 이전 좌표값값 coords_old 저장.

            if (hand.coords_old.x === 0 && hand.coords_old.y === 0) {
                hand.diff.set(0, 0);
            }
        }
    }

    getHand(index) {
        return {
            landmarks : this.handsData[index].landmarks,
            coords: this.handsData[index].coords,
            diff: this.handsData[index].diff,
            moved: this.handMoved[index]
        };
    }
}

export default new HandTracking();
