import {
  drawLandmarks,
  drawConnectors,
} from "@mediapipe/drawing_utils";
const POSE_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 7],
  [0, 4], [4, 5], [5, 6], [6, 8],
  [9, 10], [11, 12], [11, 13], [13, 15],
  [15, 17], [15, 19], [15, 21], [17, 19],
  [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], [18, 20],
  [11, 23], [12, 24], [23, 24], [23, 25], [24, 26],
  [25, 27], [26, 28], [27, 29], [28, 30],
  [29, 31], [30, 32], [27, 31], [28, 32]
];
// import {   PoseLandmarker } from "@mediapipe/tasks-vision";


class CanvasManager {
    constructor() {
        this.drawingUtils = null;
        this.drawingUtils = null;
    }
    init ($wrapper, width, height) {
        $wrapper.style.position = 'relative';

        // VideoManager.init($wrapper, width, height);
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');

        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '50%';
        this.canvas.style.transform = 'translateX(-50%)';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '10';

        this.setSize(width, height);
        $wrapper.appendChild(this.canvas);
        // console.log("POSE_CONNECTIONS", PoseLandmarker.POSE_CONNECTIONS);
        // this.drawUtils = window.drawUtils; 
        // console.log(this.drawUtils);
    }
    getElement() {
        // 호출 시 
    // const { video, ctx } = VideoManager.getElement();
    // CanvasManager.draw(video, landmarks)
    // CanvasManager.draw(video, landmarks)
        return { video: this.video, ctx: this.ctx };
    }

    setSize(width, height) {
        const scaler = 0.3;

        // 실제 캔버스 해상도 (픽셀 단위)
        this.canvas.width = width * scaler;
        this.canvas.height = height * scaler;

        // 화면에 표시될 CSS 크기 (같은 비율로 줄여야 실제 크기 줄어듦)
        this.canvas.style.width = `${width * scaler}px`;
        this.canvas.style.height = `${height * scaler}px`;
    }

    drawVideo(video){
        this.ctx.save(); // push() pop() 역할
        this.ctx.scale(-1, 1);  // 좌우 반전
        this.ctx.drawImage(video, -this.canvas.width, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();
    }

    // drawPoint(video, landmarks = []) { // 좌우 반전 안되어있음.
    //     this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    //     this.drawVideo(video);
    //     if (drawLandmarks) {
    //         // 변환된 landmark 좌표값을 사용 (x: 0~1 범위 기준)
    //         drawLandmarks(this.ctx, landmarks, {
    //             radius: 3,
    //             color: "red",
    //         });
    //     } else {
    //         console.warn('drawingUtils 또는 drawLandmarks가 정의되지 않았습니다.');
    //     }
    // }

    // drawLine(video, landmarks = []) {
    //     this.ctx.save(); // 현재 캔버스 상태 저장
    //     this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    //     this.drawVideo(video); // 반전 전 비디오 먼저 그림

    //     // 🔁 캔버스를 좌우 반전
    //     this.ctx.translate(this.canvas.width, 0); // x축 이동
    //     this.ctx.scale(-1, 1); // 좌우 반전

    //     if (landmarks.length > 0) {
    //         drawConnectors(this.ctx, landmarks, POSE_CONNECTIONS, {
    //             color: "lime",
    //             lineWidth: 2
    //         });

    //         drawLandmarks(this.ctx, landmarks, {
    //             radius: 3,
    //             color: "red",
    //         });
    //     }

    //     this.ctx.restore(); // 상태 복원
    // }
    drawLine(video, allLandmarks = []) { 
        this.ctx.save();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawVideo(video);

        // 좌우 반전
        this.ctx.translate(this.canvas.width, 0);
        this.ctx.scale(-1, 1);

        if (allLandmarks.length > 0) {
            allLandmarks.forEach((personLandmarks, idx) => {
                // 색상을 사람마다 다르게 (optional)
                const color = this.getColorForPerson(idx);

                drawConnectors(this.ctx, personLandmarks, POSE_CONNECTIONS, {
                    color,
                    lineWidth: 2
                });

                drawLandmarks(this.ctx, personLandmarks, {
                    radius: 3,
                    color,
                });
            });
        }

        this.ctx.restore();
    }

    // 사람별 랜덤 색상 생성
    getColorForPerson(idx) {
        const colors = ["lime", "cyan", "yellow", "magenta", "orange"];
        return colors[idx % colors.length];
    }


    // drawPoint(video, landmarks = []) {
        
    //     this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    //     // this.ctx.drawImage(video, 0, 0, this.canvas.width, this.canvas.height);

    //     this.drawVideo(video);

    //     landmarks.forEach(({ x, y }) => {
    //         const px = (1-x) * this.canvas.width;
    //         const py = y * this.canvas.height;
    //         this.ctx.beginPath();
    //         this.ctx.arc(px, py, 5, 0, Math.PI * 2);
    //         this.ctx.fillStyle = 'red';
    //         this.ctx.fill();
    //     });
    // }
    // drawLine(video, landmarks = []) {
        
    //     this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    //     // this.ctx.drawImage(video, 0, 0, this.canvas.width, this.canvas.height);

    //     this.drawVideo(video);

    //     if (landmarks.length > 1) {
    //         this.ctx.beginPath();
    //         landmarks.forEach(({ x, y }, index) => {
    //             const px = (1 - x) * this.canvas.width;
    //             const py = y * this.canvas.height;

    //             if (index === 0) {
    //                 this.ctx.moveTo(px, py);
    //             } else {
    //                 this.ctx.lineTo(px, py);
    //             }
    //         });
    //         this.ctx.strokeStyle = 'lime';
    //         this.ctx.lineWidth = 2;
    //         this.ctx.stroke();
    //     }
    //     landmarks.forEach(({ x, y }) => {
    //         const px = (1-x) * this.canvas.width;
    //         const py = y * this.canvas.height;
    //         this.ctx.beginPath();
    //         this.ctx.arc(px, py, 5, 0, Math.PI * 2);
    //         this.ctx.fillStyle = 'red';
    //         this.ctx.fill();
    //     });
    // }
}

export default new CanvasManager(); // instance return single ton