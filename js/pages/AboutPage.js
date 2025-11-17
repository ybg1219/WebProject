/**
 * 'About' 페이지 컴포넌트
 * @param {HTMLElement} container - 페이지가 렌더링될 DOM 요소
 * @returns {Function} 페이지가 사라질 때 호출될 정리(cleanup) 함수
 */
export function AboutPage(container) {
    // Tailwind CSS를 사용한 스타일링
    container.innerHTML = `
        <!-- 
          배경 그라데이션과 다크 테마를 적용합니다.
          min-h-screen: 최소 화면 높이를 100%로 설정합니다.
          p-4 md:p-8: 패딩을 적용합니다 (모바일/데스크탑).
        -->
        <div class="w-full min-h-screen bg-gradient-to-r from-blue-400 to-blue-600 text-slate-50 font-sans p-4 md:p-8">
            <div class="max-w-5xl mx-auto">
                
                <h1 class="text-4xl md:text-5xl font-bold mb-6 text-white">About This Project</h1>
                
                <p class="text-lg text-gray-200 mb-10">
                    이 프로젝트는 Three.js와 MediaPipe를 이용한 WebGL 기반의 인터랙티브 아트워크입니다.
                    손동작을 실시간으로 감지하여 가상의 연기(파티클)와 상호작용하는 경험을 제공합니다.
                </p>

                <!-- 
                  이미지 그리드
                  md:grid-cols-2: 모바일에서는 1열, 데스크탑에서는 2열로 표시
                  gap-8: 아이템 간의 간격
                -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    <!-- 포스터 1 -->
                    <div class="bg-slate-300/20 backdrop-blur-lg border border-white/10 rounded-2xl shadow-xl overflow-hidden">
                        <!-- [수정] Webpack의 process.env.PUBLIC_URL을 사용하도록 경로 수정 -->
                        <img src="${process.env.PUBLIC_URL}image/poster1.jpg" alt="프로젝트 포스터 1" 
                             class="w-full h-auto object-cover" 
                             onerror="this.style.display='none'; this.nextSibling.style.display='flex';">
                        
                        <!-- 이미지 로드 실패 시 Fallback UI -->
                        <div class="w-full h-64 flex items-center justify-center bg-gray-700 text-gray-400" style="display:none;">
                            이미지 로드 실패 (poster1.jpg)
                        </div>
                    </div>

                    <!-- 포스터 1 --><!-- 
                      [해결 방안 선택]
                      아래 두 가지 중 한 가지를 선택하여 적용하세요.
                      
                      방법 1: 이미지 컨테이너에 고정 높이를 주어 'object-cover'가 제대로 작동하게 함 (자르기)
                              예: class="... rounded-2xl shadow-xl overflow-hidden h-96"
                              
                      방법 2: 이미지를 컨테이너 중앙에 배치하고, 컨테이너를 이미지 크기에 맞게 조절 (여백 허용, 중앙 정렬)
                              이 경우, 이미지 태그에 'object-contain'과 컨테이너에 'flex items-center justify-center' 추가.
                              (주의: 'overflow-hidden'은 제거해야 함)
                    --><div class="bg-slate-300/20 backdrop-blur-lg border border-white/10 rounded-2xl shadow-xl overflow-hidden 
                                <!-- ★★★ 방법 1: 고정 높이 적용 (자르기/채우기) ★★★ --><!-- h-96 (예시 높이) 또는 h-[400px] 등으로 설정해 보세요. -->h-[400px] 
                                <!-- ★★★ 방법 2: 중앙 배치 (이미지 비율 유지) ★★★ --><!-- flex items-center justify-center -->">
                        <img src="${process.env.PUBLIC_URL}image/poster1.jpg" alt="프로젝트 포스터 1" 
                             class="w-full h-full 
                                    <!-- ★★★ 방법 1: object-cover 유지 (컨테이너 채우고 자르기) ★★★ -->object-cover
                                    <!-- ★★★ 방법 2: object-contain으로 변경 (이미지 전체 보여주기) ★★★ --><!-- object-contain -->" 
                             onerror="this.style.display='none'; this.nextSibling.style.display='flex';">
                        
                        <div class="w-full h-full flex items-center justify-center bg-gray-700 text-gray-400" style="display:none;">
                            이미지 로드 실패 (poster1.jpg)
                        </div>
                    </div>
                    
                    <!-- 포스터 2 -->
                    <div class="bg-slate-300/20 backdrop-blur-lg border border-white/10 rounded-2xl shadow-xl overflow-hidden">
                        <!-- [수정] Webpack의 process.env.PUBLIC_URL을 사용하도록 경로 수정 -->
                        <img src="${process.env.PUBLIC_URL}image/poster2.jpg" alt="프로젝트 포스터 2" 
                             class="w-full h-auto object-cover"
                             onerror="this.style.display='none'; this.nextSibling.style.display='flex';">
                        
                        <!-- 이미지 로드 실패 시 Fallback UI -->
                        <div class="w-full h-64 flex items-center justify-center bg-gray-700 text-gray-400" style="display:none;">
                            이미지 로드 실패 (poster2.jpg)
                        </div>
                    </div>
                </div>

                <!-- (선택사항) 홈으로 돌아가기 버튼 -->
                <div class="mt-12 text-center">
                    <button id="btn-back-to-home" class="bg-slate-100/70 hover:bg-slate-100 text-blue-900 font-semibold py-3 px-6 rounded-lg transition-colors duration-200">
                        홈으로 돌아가기
                    </button>
                </div>
            </div>
        </div>
    `;

    // "홈으로 돌아가기" 버튼에 이벤트 리스너 추가
    const backButton = container.querySelector('#btn-back-to-home');
    if (backButton) {
        // 이 페이지가 라우터에 의해 로드되므로, router.js를 import 할 필요 없이
        // window.history API를 사용하거나 location.hash를 변경할 수 있습니다.
        // 여기서는 간단하게 location.hash를 루트('/')로 변경합니다.
        backButton.addEventListener('click', () => {
            window.location.hash = '/'; // 랜딩 페이지로 이동
        });
    }

    // 정리 함수
    return () => {
        container.innerHTML = '';
    };
}