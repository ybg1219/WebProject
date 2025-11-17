/**
 * 'About' 페이지 컴포넌트
 * @param {HTMLElement} container - 페이지가 렌더링될 DOM 요소
 * @returns {Function} 페이지가 사라질 때 호출될 정리(cleanup) 함수
 */
export function AboutPage(container) {
    container.innerHTML = `
        <div class="w-full h-screen overflow-y-auto bg-gradient-to-r from-blue-400 to-blue-600 text-slate-50 font-sans pt-32">
            
            <div class="max-w-5xl mx-auto p-4 md:p-8">
                
                <h1 class="text-4xl md:text-3xl font-bold mb-8 text-white">About This Project</h1>
                
                <!-- 
                  [수정] 
                  'grid' 대신 'flexbox'를 사용합니다.
                  md:flex-row: 데스크톱에서 가로로 나열
                  justify-center: 중앙 정렬
                -->
                <div class="flex flex-col md:flex-row justify-center items-start gap-8">
                    
                    <!-- 
                      포스터 1 카드
                      [수정] w-full과 h-full을 제거하고, 고정 높이 h-[600px]를 설정합니다.
                      (너비는 자동으로 계산됩니다.)
                    -->
                    <div class="bg-slate-300/20 backdrop-blur-lg border border-white/10 rounded-2xl shadow-xl overflow-hidden h-[600px] flex items-center justify-center">
                        <!-- 
                          [수정] w-full을 제거합니다. 
                          h-full (부모의 400px)과 object-contain에 의해 너비가 자동 계산됩니다.
                        -->
                        <img src="${process.env.PUBLIC_URL}image/poster1.jpg" alt="프로젝트 포스터 1" 
                             class="h-full object-contain" 
                             onerror="this.style.display='none'; this.nextSibling.style.display='flex';">
                        
                        <!-- 로드 실패 메시지 -->
                        <div class="w-full h-full flex items-center justify-center bg-gray-700 text-gray-400" style="display:none;">
                            이미지 로드 실패 (poster1.jpg)
                        </div>
                    </div>
                    
                    <!-- 포스터 2 카드 (동일하게 수정) -->
                    <div class="bg-slate-300/20 backdrop-blur-lg border border-white/10 rounded-2xl shadow-xl overflow-hidden h-[600px] flex items-center justify-center">
                        <img src="${process.env.PUBLIC_URL}image/poster2.jpg" alt="프로젝트 포스터 2" 
                             class="h-full object-contain"
                             onerror="this.style.display='none'; this.nextSibling.style.display='flex';">
                        
                        <div class="w-full h-full flex items-center justify-center bg-gray-700 text-gray-400" style="display:none;">
                            이미지 로드 실패 (poster2.jpg)
                        </div>
                    </div>
                </div>

                <!-- 설명 텍스트 -->
                <p class="text-md text-gray-200 mt-12 leading-relaxed">
                    이 프로젝트는 Three.js와 MediaPipe를 이용한 WebGL 기반의 인터랙티브 아트워크입니다.
                    모션캡쳐를 간소화한 mediapipe를 활용하여 사용자의 모션을 실시간으로 감지하여 연기와 상호작용하는 경험을 제공합니다.
                    연기는 Stable Fluid 알고리즘을 사용하여 구현되었으며, 이류부터 확산, 난류, 소싱과 소멸까지 다양한 물리적 특성을 시뮬레이션합니다.
                    사용자는 손 제스처를 통해 연기의 움직임을 제어할 수 있으며, 이를 통해 몰입감 있는 인터랙티브 경험을 제공합니다.
                    본 프로젝트는 최신 웹 기술과 컴퓨터 비전 기술의 융합을 통해 새로운 형태의 디지털 아트를 탐구하고자 합니다.
                </p>

                <!-- 홈으로 돌아가기 버튼 -->
                <div class="mt-10 mb-20 text-center">
                    <button id="btn-back-to-home" class="bg-slate-100/70 hover:bg-slate-100 text-blue-900 font-semibold py-3 px-8 rounded-lg transition-colors duration-200 shadow-md">
                        홈으로 돌아가기
                    </button>
                </div>
            </div>
        </div>
    `;

    // 버튼 이벤트 리스너
    const backButton = container.querySelector('#btn-back-to-home');
    if (backButton) {
        backButton.addEventListener('click', () => {
            window.location.hash = '/'; // 랜딩 페이지로 이동
        });
    }

    // 정리 함수
    return () => {
        container.innerHTML = '';
    };
}