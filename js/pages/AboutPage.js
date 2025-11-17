/**
 * 'About' 페이지 컴포넌트
 * @param {HTMLElement} container - 페이지가 렌더링될 DOM 요소
 * @returns {Function} 페이지가 사라질 때 호출될 정리(cleanup) 함수
 */
export function AboutPage(container) {
    container.innerHTML = `
        <!-- 
          [수정] 
          h-screen, overflow-y-auto (스크롤 컨테이너)
          그리고 Nav Bar를 피하기 위한 'pt-32' (128px)를
          '가장 바깥쪽 div'에 모두 적용합니다.
          
          (pt-32 대신 Nav Bar 높이에 맞춰 pt-28, pt-36 등으로 조절하세요.)
        -->
        <div class="w-full h-screen overflow-y-auto bg-gradient-to-r from-blue-400 to-blue-600 text-slate-50 font-sans pt-24">
            
            <!-- 
              [수정] 
              이 div에서는 Nav Bar를 피하기 위한 pt- (padding-top)를 제거하고,
              컨텐츠 상단의 기본 여백(mb-8)만 남깁니다.
            -->
            <div class="max-w-5xl mx-auto p-4 md:p-8">
                
                <h1 class="text-4xl md:text-5xl font-bold mb-8 text-white">About This Project</h1>
                
                <!-- 이미지 그리드 -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    <!-- 포스터 1 카드 -->
                    <!-- 
                      h-[400px]: 카드 높이 고정
                      flex items-center justify-center: 이미지를 카드 정중앙에 배치
                    -->
                    <div class="bg-slate-300/20 backdrop-blur-lg border border-white/10 rounded-2xl shadow-xl overflow-hidden h-full flex items-center justify-center">
                        <!-- 
                          object-contain: 이미지 비율을 유지하며 카드 안에 쏙 들어가게 함 (잘리지 않음)
                        -->
                        <img src="${process.env.PUBLIC_URL}image/poster1.jpg" alt="프로젝트 포스터 1" 
                             class="w-full h-full object-contain" 
                             onerror="this.style.display='none'; this.nextSibling.style.display='flex';">
                        
                        <!-- 로드 실패 메시지 -->
                        <div class="w-full h-full flex items-center justify-center bg-gray-700 text-gray-400" style="display:none;">
                            이미지 로드 실패 (poster1.jpg)
                        </div>
                    </div>
                    
                    <!-- 포스터 2 카드 -->
                    <div class="bg-slate-300/20 backdrop-blur-lg border border-white/10 rounded-2xl shadow-xl overflow-hidden h-full flex items-center justify-center">
                        <img src="${process.env.PUBLIC_URL}image/poster2.jpg" alt="프로젝트 포스터 2" 
                             class="w-full h-full object-contain"
                             onerror="this.style.display='none'; this.nextSibling.style.display='flex';">
                        
                        <div class="w-full h-full flex items-center justify-center bg-gray-700 text-gray-400" style="display:none;">
                            이미지 로드 실패 (poster2.jpg)
                        </div>
                    </div>
                </div>

                <!-- 설명 텍스트 (이미지 아래로 이동됨) -->
                <p class="text-lg text-gray-200 mt-12 leading-relaxed">
                    이 프로젝트는 Three.js와 MediaPipe를 이용한 WebGL 기반의 인터랙티브 아트워크입니다.
                    손동작을 실시간으로 감지하여 가상의 연기(파티클)와 상호작용하는 경험을 제공합니다.
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