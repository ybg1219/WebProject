import { router } from '../router.js';
// [중요] LandingPage에서 넘어온 모듈들을 임포트 (정리(cleanup)할 때 필요)
import VideoManager from '../modules/VideoManager.js';
import GestureTracking from '../modules/GestureTracking.js';
import VirtualMouse from '../modules/VirtualMouse.js';

/**
 * Phase 2: 3D 연습 페이지
 * (현재는 플레이스홀더)
 */
export function PracticePage(container) {
    container.innerHTML = `
        <div class="practice-container flex flex-col items-center justify-center h-screen w-screen text-white font-sans overflow-hidden">
            <h1 class="text-4xl font-bold text-green-400">3D 연습 환경</h1>
            <p class="text-gray-400 mt-4">(Day 4-5: 여기에 Three.js 씬과 MediaPipe 연동 구현)</p>
            
            <button id="btn-practice-done" class="mt-8 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200">
                연습 완료 (메인으로 이동)
            </button>
        </div>
    `;

    const btnPracticeDone = container.querySelector('#btn-practice-done');

    const handleDone = () => {
        router.navigate('/simulation');
    };

    btnPracticeDone.addEventListener('click', handleDone);

    // 정리(cleanup) 함수
    return () => {
        btnPracticeDone.removeEventListener('click', handleDone);

        // [중요] 연습 페이지가 끝나면, /simulation으로 이동하므로
        // LandingPage에서부터 이어져 온 트래킹 모듈들을 *반드시* 파괴합니다.
        console.log("Cleaning up tracking modules from PracticePage...");
        GestureTracking.stop();
        VirtualMouse.destroy();
        VideoManager.destroy();

        container.innerHTML = '';
    };
}
