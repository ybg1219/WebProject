class VideoManager {
    constructor() {
        this.video = null;
        this.stream = null;
    }
    init($wrapper, width, height){
        this.video = document.getElementById('input_video');
        this.video.autoplay = true;
        this.video.playsInline = true;
        this.video.style.position = 'absolute';
        this.video.style.top = '0';
        this.video.style.left = '0';
        this.video.style.zIndex = '0';
        // this.video.style.transform = 'scaleX(-1)';

        this.setSize(width, height);
        $wrapper.appendChild(this.video);
    }

    setSize(width, height) {
        if (!this.video) return;
        this.video.width = width;
        this.video.height = height;
        this.video.style.width = `${width}px`;
        this.video.style.height = `${height}px`;
    }

    async startCamera() { 
        try{
            // this.width와 this.height 값의 절반을 해상도로 설정합니다.
            const targetWidth = Math.floor(this.video.width / 2);
            const targetHeight = Math.floor(this.video.height / 2);
            
            const constraints = {
                video: {
                    width: { ideal: targetWidth },
                    height: { ideal: targetHeight }
                }
            };
            this.stream = await navigator.mediaDevices.getUserMedia(constraints); // 사용자에게 권한 요청하는 비동기함수.
            this.video.srcObject = this.stream;
        } catch (err) {
            console.error('웹캠 접근 실패:', err);
            throw err;
        }
    }

    getElement() {
        return this.video;
    }
}

export default new VideoManager(); // instance return single ton