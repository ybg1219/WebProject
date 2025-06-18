class VideoManager {
    constructor() {
        
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
        this.video.width = width;
        this.video.height = height;
        this.video.style.width = `${width}px`;
        this.video.style.height = `${height}px`;
    }

    startCamera() {
        return navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                this.stream = stream;
                this.video.srcObject = stream;
            })
            .catch(err => {
                console.error('웹캠 접근 실패:', err);
                throw err;
            });
        }

    getElement() {
        return this.video;
    }
}

export default new VideoManager(); // instance return single ton