class CanvasManager {
    constructor() {
        
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
    }
    getElement() {
        // 호출 시 
    // const { video, ctx } = VideoManager.getElement();
    // anvasManager.draw(video, landmarks)
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
    drawPoint(video, landmarks = []) {
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        // this.ctx.drawImage(video, 0, 0, this.canvas.width, this.canvas.height);

        this.drawVideo(video);

        landmarks.forEach(({ x, y }) => {
            const px = (1-x) * this.canvas.width;
            const py = y * this.canvas.height;
            this.ctx.beginPath();
            this.ctx.arc(px, py, 5, 0, Math.PI * 2);
            this.ctx.fillStyle = 'red';
            this.ctx.fill();
        });
    }
    drawLine(video, landmarks = []) {
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        // this.ctx.drawImage(video, 0, 0, this.canvas.width, this.canvas.height);

        this.drawVideo(video);

        if (landmarks.length > 1) {
            this.ctx.beginPath();
            landmarks.forEach(({ x, y }, index) => {
                const px = (1 - x) * this.canvas.width;
                const py = y * this.canvas.height;

                if (index === 0) {
                    this.ctx.moveTo(px, py);
                } else {
                    this.ctx.lineTo(px, py);
                }
            });
            this.ctx.strokeStyle = 'lime';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }
        landmarks.forEach(({ x, y }) => {
            const px = (1-x) * this.canvas.width;
            const py = y * this.canvas.height;
            this.ctx.beginPath();
            this.ctx.arc(px, py, 5, 0, Math.PI * 2);
            this.ctx.fillStyle = 'red';
            this.ctx.fill();
        });
    }
}

export default new CanvasManager(); // instance return single ton