import {
    FilesetResolver,
    PoseLandmarker
} from '@mediapipe/tasks-vision';
let poseLandmarker = null;

/**
 * MediaPipe PoseLandmarker를 초기화합니다.
 */
async function initPoseLandmarker(wasmPath, modelPath) {
    // 3. FilesetResolver를 사용합니다. (이 코드는 이제 내부적으로 importScripts를 호출하지 않습니다)
    const fileset = await FilesetResolver.forVisionTasks(wasmPath);
    
    if (poseLandmarker) {
        poseLandmarker.close();
    }
    
    poseLandmarker = await PoseLandmarker.createFromOptions(fileset, {
        baseOptions: {
            modelAssetPath: modelPath
        },
        runningMode: "VIDEO", 
        numPoses: 4
    });

    console.log("Worker: PoseLandmarker initialized.");
    // 4. 메인 스레드에 준비 완료 메시지 전송
    self.postMessage({ type: 'READY' });
}

/**
 * 메인 스레드로부터 메시지를 수신합니다.
 */
self.onmessage = async (event) => {
    const { type } = event.data;
    
    try {
        if (type === 'INIT') {
            const { wasmPath, modelPath } = event.data;
            await initPoseLandmarker(wasmPath, modelPath);
        
        } else if (type === 'DETECT') {
            if (!poseLandmarker) {
                console.error("Worker: PoseLandmarker not initialized.");
                self.postMessage({ type: 'RESULT', payload: null });
                return;
            }

            const { frame, timestamp } = event.data;
            // 5. detectForVideo 실행
            const result = await poseLandmarker.detectForVideo(frame, timestamp);
            
            // 6. ImageBitmap의 메모리를 수동으로 해제합니다. (중요)
            frame.close(); 
            
            // 7. 결과를 메인 스레드로 전송
            self.postMessage({ type: 'RESULT', payload: result });
        }
    } catch (e) {
        console.error("Worker detection error:", e);
        // 8. 에러 발생 시 메인 스레드에 에러 메시지 전송
        self.postMessage({ 
            type: 'ERROR', 
            payload: { message: e.message, stack: e.stack } 
        });
    }
};