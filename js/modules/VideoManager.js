class VideoManager {
    constructor() {
        this.video = null;
        this.stream = null;
    }
    init($wrapper, width, height){
        
        this.video = document.createElement('video');
        this.video.id = 'input_video';
        
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

    async loadVideoFile(filePath) {
            this.video.src = filePath;  // public 또는 dist에 있는 mp4 경로
            this.video.loop = true;     // 반복 재생
            this.video.autoplay = true; // 자동 재생
            this.video.muted = true;    // 브라우저 자동재생 정책 우회
            await this.video.play();
        }
    

    getElement() {
        return this.video;
    }

    destroy() {
        console.log("Destroying VideoManager...");
        
        // 1. 카메라 스트림(MediaStream) 중지
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        // 2. 비디오 요소 정리
        if (this.video) {
            this.video.pause();
            this.video.srcObject = null;
            this.video.src = "";
            
            // 3. DOM에서 요소 제거
            if (this.video.parentNode) {
                this.video.parentNode.removeChild(this.video);
            }
            this.video = null;
        }
    }
}

export default new VideoManager(); // instance return single ton