import { router } from '../router.js';

/**
 * Phase 2: 튜토리얼 학습 페이지
 */
export function TutorialPage(container) {
    // [추가] 페이지 이탈 시 트래킹 모듈을 정리할지 여부
    let shouldCleanupTracking = true;

    container.innerHTML = `
        <div class="tutorial-container flex items-center justify-center h-screen w-screen text-white font-sans overflow-hidden">
            
            <!-- 1. 튜토리얼 영상 (임시 플레이스홀더) -->
            <div id="tutorial-video-placeholder" class="text-center">
                <h2 class="text-4xl font-bold text-indigo-400">튜토리얼 영상 재생 중...</h2>
                <p class="text-gray-400 mt-4">(임시 플레이스홀더 - 2초 후 사라짐)</p>
            </div>

            <!-- 2. 연습 페이지 이동 프롬프트 (LandingPage와 동일한 스타일) -->
            <div id="practice-prompt" class="prompt relative z-10 bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-11/12 text-center" style="display: none;">
                <h2 class="text-3xl font-bold mb-4">연습 페이지로 가시겠습니까?</h2>
                    <p class="text-gray-300 mb-8">방금 배운 손동작(클릭, 드래그)을 연습합니다.</p>
                    <div class="flex flex-col sm:flex-row gap-4 justify-center">
                    <button id="btn-practice-yes" class="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200">
                    예 (연습하기)
                    </button>
                    <button id="btn-practice-no" class="w-full sm:w-auto bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200">
                    아니오 (바로 시작)
                    </button>
                </div>
            </div>
        </div>
    `;

    // DOM 요소 참조
    const videoPlaceholder = container.querySelector('#tutorial-video-placeholder');
    const practicePrompt = container.querySelector('#practice-prompt');
    const btnPracticeYes = container.querySelector('#btn-practice-yes');
    const btnPracticeNo = container.querySelector('#btn-practice-no');

    // 이벤트 핸들러
    const handlePracticeYes = () => {
        // [수정] 연습 페이지로 트래킹 모듈을 가져가기 위해 파괴하지 않음
        shouldCleanupTracking = false;
        router.navigate('/practice'); // Day 4-5의 '/practice' 경로로 이동
    };

    const handlePracticeNo = () => {
        // [수정] 시뮬레이션 페이지는 자체 트래킹을 시작하므로, 현재 모듈 파괴
        shouldCleanupTracking = true;
        router.navigate('/simulation'); // 메인 시뮬레이션으로 이동
    };

    // 2초 후 영상 숨기고 프롬프트 표시
    setTimeout(() => {
        if (videoPlaceholder) videoPlaceholder.style.display = 'none';
        if (practicePrompt) practicePrompt.style.display = 'block';
    }, 2000);

    // 리스너 연결 (가상 마우스가 이미 활성화되어 있으므로 'click' 사용)
    btnPracticeYes.addEventListener('click', handlePracticeYes);
    btnPracticeNo.addEventListener('click', handlePracticeNo);

    // 정리(cleanup) 함수
    return () => {
        btnPracticeYes.removeEventListener('click', handlePracticeYes);
        btnPracticeNo.removeEventListener('click', handlePracticeNo);

        // [수정] 플래그에 따라 트래킹 모듈을 선택적으로 파괴
        if (shouldCleanupTracking) {
            console.log("Cleaning up tracking modules from TutorialPage...");
            GestureTracking.stop();
            VirtualMouse.destroy();
            VideoManager.destroy();
        } else {
            console.log("Persisting tracking modules for PracticePage...");
        }

        container.innerHTML = '';
    };
}
