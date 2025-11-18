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
                
                <div class="flex flex-col md:flex-row justify-center items-start gap-24">
                    
                <!-- 
                    포스터 1 카드
                    [수정] 
                    - transition-all, duration-300, ease-in-out: 부드러운 전환 효과
                    - hover:scale-[1.4]: 600px * 1.67 = 1002px (약 1000px)로 확대
                    - hover:z-10: 확대 시 다른 요소 위로 올라오도록 z-index 설정
                -->
                    <div class="bg-slate-300/20 backdrop-blur-lg border border-white/10 rounded-2xl shadow-xl overflow-hidden h-[550px] flex items-center justify-center
                                transition-all duration-300 ease-in-out hover:scale-[1.4] hover:z-10">
                        <!-- 
                          (내부 <img ...> 코드는 변경 없음)
                        -->
                        <img src="${process.env.PUBLIC_URL}image/poster1.jpg" alt="프로젝트 포스터 1" 
                             class="h-full object-contain" 
                             onerror="this.style.display='none'; this.nextSibling.style.display='flex';">
                        
                        <!-- 로드 실패 메시지 -->
                        <div class="w-full h-full flex items-center justify-center bg-gray-700 text-gray-400" style="display:none;">
                            이미지 로드 실패 (poster1.jpg)
                        </div>
                    </div>
                    
                    <!-- 
                      포스터 2 카드 (동일하게 수정)
                    -->
                    <div class="bg-slate-300/20 backdrop-blur-lg border border-white/10 rounded-2xl shadow-xl overflow-hidden h-[550px] flex items-center justify-center
                                transition-all duration-300 ease-in-out hover:scale-[1.4] hover:z-10">
                        <img src="${process.env.PUBLIC_URL}image/poster2.jpg" alt="프로젝트 포스터 2" 
                             class="h-full object-contain"
                             onerror="this.style.display='none'; this.nextSibling.style.display='flex';">
                        
                        <div class="w-full h-full flex items-center justify-center bg-gray-700 text-gray-400" style="display:none;">
                            이미지 로드 실패 (poster2.jpg)
                        </div>
                    </div>
                </div>

                <!-- 설명 텍스트 -->
                <p class="text-md text-gray-200 mt-12 leading-relaxed m-8">
                    이 프로젝트는 Three.js와 MediaPipe를 이용한 WebGL 기반의 인터랙티브 아트워크입니다.
                    모션캡쳐를 간소화한 mediapipe를 활용하여 사용자의 모션을 실시간으로 감지하여 연기와 상호작용하는 경험을 제공합니다.
                    연기는 Stable Fluid 알고리즘을 사용하여 구현되었으며, 이류부터 확산, 난류, 소싱과 소멸까지 다양한 물리적 특성을 시뮬레이션합니다.
                    사용자는 손 제스처를 통해 연기의 움직임을 제어할 수 있으며, 이를 통해 몰입감 있는 인터랙티브 경험을 제공합니다.
                    본 프로젝트는 최신 웹 기술과 컴퓨터 비전 기술의 융합을 통해 새로운 형태의 디지털 아트를 탐구하고자 합니다.
                </p>



                <!-- ==================== Chapter 1 ==================== -->
                <div class="mb-8 border-l-4 border-white pl-6">
                    <h2 class="text-3xl md:text-4xl font-bold text-white drop-shadow-md">
                            Ch1 : Stable Fluid
                    </h2>
                    <p class="text-xl text-blue-100 mt-2 font-light">유체의 움직임을 계산하다</p>
                </div>             
                <!-- Intro & Equation Section -->
                <div class="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 md:p-10 shadow-xl mb-12 hover:bg-white/15 transition-colors duration-300">
                    <div class="flex justify-center mb-8 bg-black/10 rounded-2xl p-6 border border-white/10">
                        <!-- 나비에-스토크스 방정식 -->
                        <div class="flex justify-center mb-8 bg-black/20 rounded-2xl p-8 border border-white/10 overflow-x-auto">
                        <div class="font-serif text-xl md:text-2xl text-blue-50 text-center leading-relaxed min-w-max">
                            <!-- 운동량 방정식 -->
                            <div class="flex items-center justify-center gap-3 mb-4">
                                <!-- du/dt -->
                                <div class="flex flex-col items-center mx-1">
                                    <div class="border-b border-white/40 pb-1 mb-1 px-1">∂<span class="font-bold italic">u</span></div>
                                    <div class="px-1">∂<span class="italic">t</span></div>
                                </div>
                                
                                <span class="opacity-80">+</span>
                                
                                <!-- (u . del) u -->
                                <div>
                                    (<span class="font-bold italic">u</span> ⋅ ∇) <span class="font-bold italic">u</span>
                                </div>
                                
                                <span class="opacity-80">=</span>
                                
                                <span class="opacity-80">−</span>
                                
                                <!-- 1/p del p -->
                                <div class="flex items-center mx-1">
                                    <div class="flex flex-col items-center mr-1">
                                        <div class="border-b border-white/40 pb-1 mb-1 px-1 text-lg">1</div>
                                        <div class="italic text-lg">ρ</div>
                                    </div>
                                    ∇<span class="italic">p</span>
                                </div>
                                
                                <span class="opacity-80">+</span>
                                
                                <!-- v del^2 u -->
                                <div>
                                    <span class="italic">v</span> ∇²<span class="font-bold italic">u</span>
                                </div>
                                
                                <span class="opacity-80">+</span>
                                
                                <!-- f -->
                                <div class="font-bold italic">f</div>
                            </div>

                            <!-- 연속 방정식 -->
                            <div class="flex items-center justify-center border-t border-white/20 pt-4 mt-2">
                                Continuity Equation : ∇ ⋅ <span class="font-bold italic ml-1">u</span> <span class="mx-3 opacity-80">=</span> 0
                            </div>
                        </div>
                    </div>
                    </div>
            
                    <div class="space-y-5 text-lg leading-relaxed text-blue-50">
                         <p>
                            여러 유체 시뮬레이션 기법 중 <span class="text-blue-900 font-bold">Stable Fluids</span> 기법은 계산이 안정적이고 구현이 비교적 간단해, 본 프로젝트에 가장 적합한 방식입니다. 
                            이 기법은 1999년 <strong>Jos Stam</strong>에 의해 제안되었습니다.
                         </p>
                         <p>
                            유체의 움직임을 기술하는 <span class="text-blue-900 font-bold">나비에–스토크스 방정식</span>은 밀레니엄 문제 중 하나로 꼽힐 만큼 복잡하며, 현재 일반해를 구할 수 없습니다. 
                            따라서 컴퓨터 그래픽스 분야에서는 시간과 공간을 이산화(discretization)하여 근사하는 수치해석 기법을 사용합니다.
                         </p>
                         <p>
                            기존의 오일러리안(Eulerian) 방식은 오차가 누적되어 시뮬레이션이 발산하기 쉬웠으나, 
                            Stable Fluids는 <strong>Semi-Lagrangian</strong> 기법을 도입하여 미래의 유체가 어디서 왔는지 역추적하는 방식으로 
                            <strong>안정성</strong>을 확보했습니다.
                         </p>
                        <p>
                            다만, 이 방식은 수치적 소산으로 인해 에너지와 디테일이 소실되는 단점이 있어, 
                            본 프로젝트에서는 <strong>Perlin Noise</strong>를 활용한 <strong>와류(Vortex)</strong> 효과를 추가하여 이를 보완했습니다.
                        </p>
                    </div>
                </div>
                

                <!-- Steps Grid -->
                <h3 class="text-3xl font-bold text-white mb-8 pl-2 border-l-8 border-blue-500">
                    Simulation Steps
                </h3>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
                    
                    <!-- Step 1 -->
                    <div class="bg-white/10 backdrop-blur-sm p-6 rounded-xl hover:bg-gray-750 transition border-t-4 border-blue-500 shadow-lg">
                        <div class="flex items-center mb-3">
                            <span class="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3">1</span>
                            <h4 class="text-xl font-bold text-blue-300">Advection (이류)</h4>
                        </div>
                        <p class="text-sm text-gray-200 mb-2 font-semibold">유체의 속도에 따라 연기가 이동하는 단계</p>
                        <p class="text-gray-300 text-sm leading-relaxed">
                            Semi-Lagrangian 기법을 사용하여, 격자(Grid)의 각 지점에서 속도 벡터를 따라 과거 위치를 역추적(Back-trace)하고, 그 위치의 물리량을 현재로 가져옵니다.
                        </p>
                    </div>

                    <!-- Step 2 -->
                    <div class="bg-white/10 backdrop-blur-sm p-6 rounded-xl hover:bg-gray-750 transition border-t-4 border-green-500 shadow-lg">
                        <div class="flex items-center mb-3">
                            <span class="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3">2</span>
                            <h4 class="text-xl font-bold text-green-300">External Force (외력)</h4>
                        </div>
                        <p class="text-sm text-gray-200 mb-2 font-semibold">외부에서 힘을 가하는 단계</p>
                        <p class="text-gray-300 text-sm leading-relaxed">
                            유체 자체의 힘이 아닌, 외부의 개입(사용자의 손 움직임, 바람 등)을 속도장에 더해줍니다. 본 프로젝트에서는 웹캠으로 인식된 손 좌표가 외력으로 작용합니다.
                        </p>
                    </div>

                    <!-- Step 3 -->
                    <div class="bg-white/10 backdrop-blur-sm p-6 rounded-xl hover:bg-gray-750 transition border-t-4 border-yellow-500 shadow-lg">
                        <div class="flex items-center mb-3">
                            <span class="bg-yellow-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3">3</span>
                            <h4 class="text-xl font-bold text-yellow-300">Viscous (점성)</h4>
                        </div>
                        <p class="text-sm text-gray-200 mb-2 font-semibold">확산(Diffusion)과 끈적임을 계산하는 단계</p>
                        <p class="text-gray-300 text-sm leading-relaxed">
                            유체가 주변으로 퍼져나가는 정도를 계산합니다. 주변 픽셀들과 값을 교환하며 평형을 맞추는 과정(Jacobi iteration 등)을 통해 끈적이는 유체를 표현합니다.
                        </p>
                    </div>

                    <!-- Step 4 -->
                    <div class="bg-white/10 backdrop-blur-sm p-6 rounded-xl hover:bg-gray-750 transition border-t-4 border-red-500 shadow-lg">
                        <div class="flex items-center mb-3">
                            <span class="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3">4</span>
                            <h4 class="text-xl font-bold text-red-300">Projection (투영)</h4>
                        </div>
                        <p class="text-sm text-gray-200 mb-2 font-semibold">질량 보존 법칙을 위한 속도장 보정 단계</p>
                        <p class="text-gray-300 text-sm leading-relaxed">
                            유체가 압축되지 않도록(Incompressible), 속도장의 발산(Divergence)을 계산한 뒤 이를 상쇄시키는 압력을 푸아송 방정식으로 구합니다. 이를 통해 <strong>Divergence-free</strong>한 자연스러운 흐름을 만듭니다.
                        </p>
                    </div>

                    <!-- Step 5 -->
                    <div class="bg-white/10 backdrop-blur-sm p-6 rounded-xl hover:bg-gray-750 transition border-t-4 border-purple-500 shadow-lg">
                        <div class="flex items-center mb-3">
                            <span class="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3">5</span>
                            <h4 class="text-xl font-bold text-purple-300">Density Sourcing</h4>
                        </div>
                        <p class="text-sm text-gray-200 mb-2 font-semibold">연기(물질)를 생성하고 제어하는 단계</p>
                        <p class="text-gray-300 text-sm leading-relaxed">
                            속도장과 별개로 눈에 보이는 '연기(Density)'를 생성합니다. 사용자의 손 위치에 따라 밀도를 추가하고, 시간이 지남에 따라 자연스럽게 사라지도록 소멸 계수를 적용합니다.
                        </p>
                    </div>

                    <!-- Step 6 -->
                    <div class="bg-white/10 backdrop-blur-sm p-6 rounded-xl hover:bg-gray-750 transition border-t-4 border-indigo-500 shadow-lg">
                        <div class="flex items-center mb-3">
                            <span class="bg-indigo-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3">6</span>
                            <h4 class="text-xl font-bold text-indigo-300">Vortex (와류)</h4>
                        </div>
                        <p class="text-sm text-gray-200 mb-2 font-semibold">디테일한 소용돌이를 추가하는 단계</p>
                        <p class="text-gray-300 text-sm leading-relaxed">
                            Stable Fluids의 단점인 디테일 부족을 보완하기 위해, <strong>Perlin Noise</strong>나 Curl Noise를 사용하여 인위적인 회전력을 더해줌으로써 더욱 역동적인 연기를 표현합니다.
                        </p>
                    </div>
                </div>


            <!-- ==================== Chapter 2 ==================== -->
                <section class="mb-20">
                <div class="mb-8 border-l-4 border-teal-300 pl-6">
                    <h2 class="text-3xl md:text-4xl font-bold text-white drop-shadow-md">
                         Ch2 : Interaction
                     </h2>
                    <p class="text-xl text-teal-100 mt-2 font-light">사용자와 상호작용하다</p>
                </div>              
                <!-- Mediapipe Intro Section -->
                <div class="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 shadow-xl mb-10 hover:bg-white/15 transition-transform duration-300">
                     <div class="flex flex-col md:flex-row items-center gap-8 mb-6">
                        <div class="w-full md:w-1/3 flex justify-center bg-black/10 rounded-2xl p-4 border border-white/10">
                            <!-- Mediapipe Logo Placeholder -->
                            <div class="opacity-90 transform scale-95">
                            </div>
                        </div>
                        <div class="w-full md:w-2/3 space-y-4 text-lg leading-relaxed text-blue-50">
                            <p>
                            기존의 모션 캡쳐는 고가의 장비와 복잡한 기술이 필요하지만, 본 프로젝트에서는 <strong>웹캠(Webcam)</strong>만으로 사용자와 상호작용합니다. 
                            </p>
                            <p>
                                이를 위해 구글에서 개발한 CNN 기반의 고성능 딥러닝 라이브러리인 <strong><span class="text-teal-300 font-bold">Mediapipe</span></strong>를 활용하여 실시간으로 사용자의 자세를 추정합니다.
                            </p>
                            <div class="bg-teal-900/30 p-5 rounded-xl border-l-4 border-teal-300 text-sm text-teal-100 mt-4">
                                <strong class="text-white block mb-1 text-base">💡 웹 환경 최적화 (Optimization)</strong>
                                영화처럼 정교한 고품질의 트래킹보다는 실시간 반응성이 중요하므로, 
                                <strong>프레임 수 제한</strong>, <strong>비동기 처리(Web Worker)</strong>, 그리고 
                                <strong>영상 해상도 조절</strong> 등의 방법을 통해 브라우저의 프레임 레이트(FPS)를 안정적으로 유지합니다.
                             </div>
                         </div>
                     </div>
                </div>              
                <!-- Mediapipe Features Grid -->
                <h3 class="text-2xl font-bold text-white mb-6 pl-2">
                     Technology Stack
                </h3>               
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <!-- Feature 1 -->
                     <div class="bg-white/10 backdrop-blur-sm p-6 rounded-2xl shadow-lg hover:bg-white/20 transition duration-300 group border border-white/5">
                         <div class="mb-4 text-teal-300 group-hover:text-white transition-colors">
                             <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                         </div>
                         <h4 class="text-lg font-bold text-white mb-2">Task Vision</h4>
                         <p class="text-blue-100 text-sm leading-relaxed">
                             Mediapipe의 컴퓨터 비전 모델 실행을 간소화하는 파이프라인입니다. 모델 로딩과 데이터 전처리 과정을 추상화하여 사용성을 높였습니다.
                         </p>
                     </div>              
                     <!-- Feature 2 -->
                     <div class="bg-white/10 backdrop-blur-sm p-6 rounded-2xl shadow-lg hover:bg-white/20 transition duration-300 group border border-white/5">
                         <div class="mb-4 text-teal-300 group-hover:text-white transition-colors">
                             <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                         </div>
                         <h4 class="text-lg font-bold text-white mb-2">Pose Landmarker</h4>
                         <p class="text-blue-100 text-sm leading-relaxed">
                             관절 <strong>33개의 랜드마크</strong>를 실시간 분석합니다. 팔의 위치나 움직임을 파악하고 이를 시뮬레이션의 외력(Force)으로 변환합니다.
                         </p>
                     </div>              
                     <!-- Feature 3 -->
                     <div class="bg-white/10 backdrop-blur-sm p-6 rounded-2xl shadow-lg hover:bg-white/20 transition duration-300 group border border-white/5">
                         <div class="mb-4 text-teal-300 group-hover:text-white transition-colors">
                             <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11"></path></svg>
                         </div>
                         <h4 class="text-lg font-bold text-white mb-2">Gesture Recognizer</h4>
                         <p class="text-blue-100 text-sm leading-relaxed">
                             단순한 위치 추적을 넘어, 주먹 쥐기나 손바닥 펴기 같은 제스처를 인식하여 터치 없이 기능을 제어할 수 있게 합니다.
                         </p>
                     </div>
                </div>
                </section>
                <!-- ==================== Portfolio Section ==================== -->
                

                <h2 class="text-3xl font-bold mt-16 mb-8 text-white text-center">Portfolio</h2>
                <div class="flex justify-center mb-20"> <!-- 하단 여백 mb-20 추가 -->
                    <!-- 포트폴리오 카드 -->
                    <div class="bg-slate-300/20 backdrop-blur-lg border border-white/10 rounded-2xl shadow-xl overflow-hidden h-[600px] flex items-center justify-center">
                        <img src="${process.env.PUBLIC_URL}image/portfolio.jpg" alt="포트폴리오 이미지" 
                             class="h-full object-contain" 
                             onerror="this.style.display='none'; this.nextSibling.style.display='flex';">
                        
                        <!-- 로드 실패 메시지 -->
                        <div class="w-full h-full flex items-center justify-center bg-gray-700 text-gray-400" style="display:none;">
                            이미지 로드 실패 (portpolio.jpg)
                        </div>
                    </div>
                </div>
            </div>
            
            </div>
        </div>
    `;

    // 정리 함수
    return () => {
        container.innerHTML = '';
    };
}