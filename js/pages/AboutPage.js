/**
 * 'About' 페이지 컴포넌트
 * 리팩토링: 반복되는 UI 요소를 데이터 기반으로 생성하여 코드 길이를 줄이고 가독성을 높였습니다.
 * 수정: 시뮬레이션 단계의 배경색을 각 단계별 색상(투명도 50%)으로 변경하고 설명을 복원했습니다.
 */
export function AboutPage(container) {
    const publicUrl = process.env.PUBLIC_URL || '';
    
    // 공통 애니메이션 클래스
    const animClass = "opacity-0 translate-y-10 transition-all duration-700 ease-out js-scroll";

    // ==================== Data & Configurations ====================

    // 1. 시뮬레이션 단계 데이터 (설명 복원됨)
    const simulationSteps = [
        { 
            step: 1, 
            title: "Advection (이류)", 
            color: "blue", 
            sub: "유체의 속도에 따라 연기가 이동하는 단계",
            desc: "Semi-Lagrangian 기법을 사용하여 격자의 각 지점에서 속도 벡터를 따라 과거 위치를 역추적하고, 그 위치의 물리량을 현재로 가져옵니다." 
        },
        { 
            step: 2, 
            title: "External Force (외력)", 
            color: "green", 
            sub: "외부에서 힘을 가하는 단계",
            desc: "유체 자체의 힘이 아닌, 외부의 개입(사용자의 손 움직임 등)을 속도장에 더해줍니다. 웹캠으로 인식된 손 좌표가 외력으로 작용합니다." 
        },
        { 
            step: 3, 
            title: "Viscous (점성)", 
            color: "yellow", 
            sub: "확산(Diffusion)과 끈적임을 계산하는 단계",
            desc: "유체가 주변으로 퍼져나가는 정도를 계산합니다. 주변 픽셀들과 값을 교환하며 평형을 맞추는 과정을 통해 끈적이는 유체를 표현합니다." 
        },
        { 
            step: 4, 
            title: "Projection (투영)", 
            color: "red", 
            sub: "질량 보존 법칙을 위한 속도장 보정하는 단계",
            desc: "유체가 압축되지 않도록(Incompressible), 속도장의 발산(Divergence)을 계산하고 상쇄시켜 Divergence-free한 흐름을 만듭니다." 
        },
        { 
            step: 5, 
            title: "Density Sourcing", 
            color: "purple", 
            sub: "연기(물질)를 생성하고 제어하는 단계",
            desc: "사용자의 손 위치에 따라 연기(Density)를 생성하고, 시간이 지남에 따라 자연스럽게 사라지도록 소멸 계수를 적용합니다." 
        },
        { 
            step: 6, 
            title: "Vortex (와류)", 
            color: "indigo", 
            sub: "디테일한 소용돌이를 추가하는 단계",
            desc: "Stable Fluids의 단점인 디테일 부족을 보완하기 위해, Perlin Noise를 사용하여 인위적인 회전력을 더해 역동적인 연기를 표현합니다." 
        }
    ];

    // 2. 기술 스택 데이터 (Mediapipe)
    const techFeatures = [
        { 
            title: "Task Vision", 
            desc: "Mediapipe의 컴퓨터 비전 모델 실행을 간소화하는 파이프라인입니다. 모델 로딩과 데이터 전처리 과정을 추상화하여 사용성을 높였습니다.",
            iconPath: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
        },
        { 
            title: "Pose Landmarker", 
            desc: "관절 <strong>33개의 랜드마크</strong>를 실시간 분석합니다. 팔의 위치나 움직임을 파악하고 이를 시뮬레이션의 외력(Force)으로 변환합니다.",
            iconPath: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
        },
        { 
            title: "Gesture Recognizer", 
            desc: "단순한 위치 추적을 넘어, 주먹 쥐기나 손바닥 펴기 같은 제스처를 인식하여 터치 없이 기능을 제어할 수 있게 합니다.",
            iconPath: "M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" 
        }
    ];

    // 3. 전체 프로젝트 기술 스택 데이터
    const projectTechStack = [
        { 
            name: "WebGL", 
            desc: "웹 표준 2D/3D 그래픽스 라이브러리", 
            role: "유체의 속도와 압력 정보를 텍스처에 저장하고, GPU 가속을 통해 고속 연산을 수행합니다." 
        },
        { 
            name: "Three.js", 
            desc: "WebGL을 쉽게 다루기 위한 자바스크립트 3D 라이브러리", 
            role: "복잡한 셰이더(Shader) 코드 관리와 3D 씬(Scene), 카메라 구성을 담당합니다." 
        },
        { 
            name: "GitHub Pages", 
            desc: "GitHub 저장소 기반의 정적 웹 호스팅 서비스", 
            role: "별도의 백엔드 서버 구축 없이, 빌드된 결과물을 웹상에 배포하여 접근성을 높였습니다." 
        },
        { 
            name: "Tailwind CSS", 
            desc: "유틸리티 퍼스트(Utility-first) CSS 프레임워크", 
            role: "Glassmorphism 디자인과 반응형 레이아웃을 신속하고 일관성 있게 구현했습니다." 
        },
        { 
            name: "MediaPipe", 
            desc: "구글의 온디바이스 머신러닝(ML) 솔루션", 
            role: "웹캠 영상에서 실시간으로 손의 랜드마크를 추출하여 인터랙션의 입력값으로 사용합니다." 
        },
        { 
            name: "JavaScript (ES6+)", 
            desc: "웹 브라우저의 표준 프로그래밍 언어", 
            role: "전체 애플리케이션의 생명주기 관리, 모듈 간 통신, 그리고 DOM 조작을 제어합니다." 
        }
    ];

    // ==================== Helper Functions (Templates) ====================

    // [Helper] 포스터 카드 생성 (캡션 추가됨)
    // caption 인자를 받아서 이미지가 아래에 텍스트를 렌더링합니다.
    const createPosterCard = (imgName, altText, caption = "", isLarge = false, delayClass = "") => `
        <div class="${animClass} ${delayClass} flex flex-col items-center gap-6">
            <!-- 카드 영역 -->
            <div class="group bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl shadow-xl overflow-hidden 
                        ${isLarge ? 'w-full max-w-6xl h-auto min-h-[600px]' : 'w-full md:w-[500px] h-[720px]'} 
                        flex items-center justify-center transition-all duration-300 ease-out hover:scale-110 hover:shadow-blue-300/30 hover:border-white/40 z-0 hover:z-10">
                <img src="${publicUrl}/image/${imgName}" alt="${altText}" 
                     class="${isLarge ? 'w-full h-full object-contain p-2' : 'h-full w-full object-cover'} opacity-90 group-hover:opacity-100 transition-opacity duration-300" 
                     onerror="this.style.display='none'; this.nextSibling.style.display='flex';">
                <div class="w-full h-full flex flex-col items-center justify-center bg-blue-900/20 text-blue-100 p-4 text-center" style="display:none;">
                    <span class="text-4xl mb-2">🖼️</span>
                    <span class="font-semibold">Image Not Found</span>
                    <span class="text-sm opacity-70">${imgName}</span>
                </div>
            </div>
            
            <!-- 캡션 영역 (caption이 있을 때만 표시) -->
            ${caption ? `
            <p class="text-sm md:text-md text-blue-100 font-md tracking-wide bg-white/5 px-6 py-2 rounded-full">
                <span class="font-bold text-white mr-2">${caption.split(':')[0]}</span> : ${caption.split(':')[1]}
            </p>
            ` : ''}
        </div>
    `;

    // [Helper] 포트폴리오 카드 생성
    const createPortfolioCard = (imgName, altText, isLarge = false, delayClass = "") => `
        <div class="${animClass} ${delayClass} group bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl shadow-2xl overflow-hidden 
                    ${isLarge ? 'w-full max-w-6xl h-auto min-h-[600px]' : 'w-full md:w-[400px] h-[550px]'} 
                    flex items-center justify-center transition-all duration-200 ease-out hover:scale-110 hover:shadow-blue-300/30 hover:border-white/40 z-0 hover:z-10">
            <img src="${publicUrl}/image/${imgName}" alt="${altText}" 
                 class="${isLarge ? 'w-full h-full' : 'h-full w-full'} object-contain opacity-90 group-hover:opacity-100 transition-opacity duration-300" 
                 onerror="this.style.display='none'; this.nextSibling.style.display='flex';">
            <div class="w-full h-full flex flex-col items-center justify-center bg-blue-900/20 text-blue-100 p-4 text-center" style="display:none;">
                <span class="text-4xl mb-2">🖼️</span>
                <span class="font-semibold">Image Not Found</span>
                <span class="text-sm opacity-70">${imgName}</span>
            </div>
        </div>
    `;

    // [Helper] 시뮬레이션 단계 카드 생성 (배경색 적용 및 설명 복원)
    // bg-${color}-900/50 : 각 단계의 색상을 배경에 50% 투명도로 적용
    const createStepCard = ({ step, title, color, sub, desc }, index) => `
        <div class="${animClass} ${index % 2 !== 0 ? 'delay-100' : ''} bg-white/10 backdrop-blur-sm p-6 rounded-2xl border-t-4 border-${color}-300 shadow-lg hover:bg-${color}-900/70 transition duration-300">
            <div class="flex items-center mb-3">
                <span class="bg-${color}-300 text-${color}-900 rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3 text-sm">${step}</span>
                <h4 class="text-xl font-bold text-white">${title}</h4>
            </div>
            <p class="text-sm text-${color}-100 mb-2 font-semibold opacity-90">${sub}</p>
            <p class="text-blue-50 text-sm leading-relaxed opacity-95">${desc}</p>
        </div>
    `;

    // [Helper] 기술 스택 카드 생성
    const createTechCard = ({ title, desc, iconPath }, index) => `
        <div class="${animClass} delay-${index * 100} bg-white/10 backdrop-blur-sm p-6 rounded-2xl shadow-lg hover:bg-white/20 transition duration-300 group border border-white/5">
            <div class="mb-4 text-teal-300 group-hover:text-white transition-colors">
                <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${iconPath}"></path>
                </svg>
            </div>
            <h4 class="text-lg font-bold text-white mb-2">${title}</h4>
            <p class="text-blue-100 text-sm leading-relaxed">${desc}</p>
        </div>
    `;

    
    // [Helper] 통합 기술 스택 리스트 아이템 생성
    const createStackListItem = ({ name, desc, role }, index) => `
        <div class="flex flex-col md:flex-row md:items-start gap-2 md:gap-4 p-4 rounded-xl hover:bg-white/5 transition duration-200 border-b border-white/5 last:border-0">
            <div class="flex items-center gap-3 md:w-48 flex-shrink-0">
                <span class="flex justify-center items-center w-6 h-6 bg-blue-500 text-white rounded-full text-xs font-bold">${index + 1}</span>
                <h4 class="text-lg font-bold text-white">${name}</h4>
            </div>
            <div class="flex-1">
                <p class="text-blue-200 text-sm font-semibold mb-1">${desc}</p>
                <p class="text-blue-50 text-sm leading-relaxed opacity-90">${role}</p>
            </div>
        </div>
    `;

    // ==================== Main Render ====================

    container.innerHTML = `
        <div class="w-full h-screen overflow-y-auto bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 text-white font-sans pt-24 pb-12 overflow-x-hidden">
            <div class="max-w-6xl mx-auto p-4 md:p-6">
                
                <!-- Header -->
                <h1 class="${animClass} text-2xl md:text-5xl font-bold mt-8 mb-12 text-white text-center tracking-tight">
                    About This Project
                </h1>
                
                <!-- Posters -->
                <div class="flex flex-col md:flex-row justify-center items-center gap-8 md:gap-16 mb-8">
                    ${createPosterCard('poster1.jpg', '프로젝트 포스터 1', 'Poster 1 : 인스타 디자인 포스터')}
                    ${createPosterCard('poster2.jpg', '프로젝트 포스터 2', 'Poster 2 : 전시 학술 포스터', false, 'delay-200')}
                </div>

                <!-- Project Description -->
                <div class="${animClass} p-4 max-w-6xl mx-auto mb-20">
                    <p class="text-md md:text-lg text-blue-50 leading-relaxed text-left font-md">
                        이 프로젝트는 <strong>Three.js</strong>와 <strong>MediaPipe</strong>를 이용한 WebGL 기반의 인터랙티브 아트워크입니다.<br><br>
                        Deep Learning을 통해 모션캡쳐를 간소화하여 사용자의 모션을 실시간으로 감지하고 연기와 상호작용하는 경험을 제공합니다.
                        연기는 <strong>Stable Fluid</strong> 알고리즘을 사용하여 구현되었으며, 이류부터 확산, 난류, 소싱과 소멸까지 다양한 물리적 특성을 시뮬레이션합니다.<br><br>
                        사용자는 손 제스처를 통해 연기의 움직임을 제어할 수 있으며, 이를 통해 몰입감 있는 인터랙티브 경험을 제공합니다.
                        본 프로젝트는 최신 웹 기술과 컴퓨터 비전 기술의 융합을 통해 새로운 형태의 디지털 아트를 탐구하고자 합니다.
                    </p>
                </div>

                <!-- Ch1: Stable Fluid -->
                <div class="${animClass} mb-8 border-l-4 border-white pl-6">
                    <h2 class="text-3xl md:text-4xl font-bold text-white">Ch1 : Stable Fluid</h2>
                    <p class="text-xl text-blue-100 mt-2 font-light">유체의 움직임을 계산하다</p>
                </div>

                <!-- Equation Section -->
                <div class="${animClass} bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 md:p-10 shadow-xl mb-12 hover:bg-white/15 transition-colors duration-300">
                    <div class="flex justify-center mb-8 bg-black/20 rounded-2xl p-8 border border-white/10 overflow-x-auto">
                        <div class="font-serif text-xl md:text-2xl text-blue-50 text-center leading-relaxed min-w-max">
                            <!-- Navier-Stokes Equation Layout -->
                            <div class="flex items-center justify-center gap-3 mb-4">
                                <div class="flex flex-col items-center mx-1">
                                    <div class="border-b border-white/40 pb-1 mb-1 px-1">∂<span class="font-bold italic">u</span></div>
                                    <div class="px-1">∂<span class="italic">t</span></div>
                                </div>
                                <span class="opacity-80">+</span>
                                <div>(<span class="font-bold italic">u</span> ⋅ ∇) <span class="font-bold italic">u</span></div>
                                <span class="opacity-80">=</span>
                                <span class="opacity-80">−</span>
                                <div class="flex items-center mx-1">
                                    <div class="flex flex-col items-center mr-1">
                                        <div class="border-b border-white/40 pb-1 mb-1 px-1 text-lg">1</div>
                                        <div class="italic text-lg">ρ</div>
                                    </div>
                                    ∇<span class="italic">p</span>
                                </div>
                                <span class="opacity-80">+</span>
                                <div><span class="italic">ν</span> ∇²<span class="font-bold italic">u</span></div>
                                <span class="opacity-80">+</span>
                                <div class="font-bold italic">f</div>
                            </div>
                            <div class="flex items-center justify-center border-t border-white/20 pt-4 mt-2">
                                ∇ ⋅ <span class="font-bold italic ml-1">u</span> <span class="mx-3 opacity-80">=</span> 0
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
                            Stable Fluids는 <strong>Semi-Lagrangian</strong> 기법을 도입하여 미래의 유체가 어디서 왔는지 역추적하는 방식으로 <strong>안정성</strong>을 확보했습니다.
                        </p>
                        <p>
                            다만, 이 방식은 수치적 소산으로 인해 에너지와 디테일이 소실되는 단점이 있어, 
                            본 프로젝트에서는 <strong>Perlin Noise</strong>를 활용한 <strong>와류(Vortex)</strong> 효과를 추가하여 이를 보완했습니다.
                        </p>
                    </div>
                </div>

                <!-- Simulation Steps Grid -->
                <h3 class="${animClass} text-2xl font-bold text-white mb-8 flex items-center">
                    <span class="bg-white text-blue-600 rounded-lg px-3 py-1 mr-3 text-lg">Process</span>
                    Simulation Steps
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20">
                    ${simulationSteps.map(createStepCard).join('')}
                </div>


                <!-- Ch2: Interaction -->
                <section class="mb-20">
                    <div class="${animClass} mb-8 border-l-4 border-teal-300 pl-6">
                        <h2 class="text-3xl md:text-4xl font-bold text-white ">Ch2 : Interaction</h2>
                        <p class="text-xl text-teal-100 mt-2 font-light">사용자와 상호작용하다</p>
                    </div>

                    <!-- Mediapipe Intro -->
                    <div class="${animClass} bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 shadow-xl mb-10 hover:bg-white/15 transition-transform duration-300">
                        <div class="flex flex-col md:flex-row items-center gap-8 mb-6">
                            <div class="w-full md:w-1/2 flex justify-center bg-white/80 rounded-2xl p-2 border border-white/10">
                                <div class="transform scale-95">
                                    <img src="${publicUrl}/image/tracking.png" alt="Mediapipe Mechanism Figure" 
                                         onerror="this.parentElement.innerHTML='<span class=text-gray-500>Tracking Image Not Found</span>'">
                                </div>
                            </div>
                            <div class="w-full md:w-2/3 space-y-4 text-lg leading-relaxed text-blue-50">
                                <p>기존의 모션 캡쳐는 고가의 장비와 복잡한 기술이 필요하지만, 본 프로젝트에서는 <strong>웹캠(Webcam)</strong>만으로 사용자와 상호작용합니다.</p>
                                <p>이를 위해 구글에서 개발한 CNN 기반의 고성능 딥러닝 라이브러리인 <strong><span class="text-teal-300 font-bold">Mediapipe</span></strong>를 활용하여 실시간으로 사용자의 자세를 추정합니다.</p>
                                <div class="bg-teal-900/30 p-5 rounded-xl border-l-4 border-teal-300 text-sm text-teal-100 mt-4">
                                    <strong class="text-white block mb-1 text-base">💡 웹 환경 최적화 (Optimization)</strong>
                                    영화처럼 정교한 고품질의 트래킹보다는 실시간 반응성이 중요하므로, <strong>프레임 수 제한</strong>, <strong>비동기 처리(Web Worker)</strong>, 그리고 <strong>영상 해상도 조절</strong> 등의 방법을 통해 브라우저의 프레임 레이트(FPS)를 안정적으로 유지합니다.
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Tech Stack Grid -->
                    <h3 class="${animClass} text-2xl font-bold text-white mb-6 pl-2">Technology Stack</h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        ${techFeatures.map(createTechCard).join('')}
                    </div>
                </section>

                <!-- Project Tech Stack -->
                <section class="mb-24">
                    <div class="${animClass} mb-8 border-l-4 border-indigo-400 pl-6">
                        <h2 class="text-3xl md:text-4xl font-bold text-white drop-shadow-md">Project Tech Stack</h2>
                        <p class="text-xl text-indigo-100 mt-2 font-light">프로젝트에 사용된 기술</p>
                    </div>

                    <!-- Tech Stack List Card -->
                    <div class="${animClass} bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-4 md:p-6 shadow-xl">
                        <!-- Image centered horizontally -->
                        <div class="flex justify-center w-full mb-4">
                            <img src="${publicUrl}/image/stack.png" alt="Tech Stack Overview" 
                                 class="max-w-full md:max-w-2xl h-auto object-contain rounded-lg"
                                 onerror="this.style.display='none';">
                        </div>
                        <div class="flex flex-col">
                            ${projectTechStack.map(createStackListItem).join('')}
                        </div>
                    </div>
                </section>


                <!-- ==================== Live Demo Access (QR Code) ==================== -->
                <section class="mb-24">
                    <div class="${animClass} mb-8 border-l-4 border-yellow-400 pl-6">
                        <h2 class="text-3xl md:text-4xl font-bold text-white drop-shadow-md">Live Demo Access</h2>
                        <p class="text-xl text-yellow-100 mt-2 font-light">집에서도 경험하는 인터랙티브 아트</p>
                    </div>

                    <div class="${animClass} bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 shadow-xl hover:bg-white/15 transition-all duration-300">
                        <div class="flex flex-col md:flex-row items-center gap-10">
                            
                            <!-- QR Code Image Container -->
                            <div class="w-full md:w-auto flex-shrink-0 flex justify-center">
                                <div class="bg-white p-3 rounded-2xl shadow-lg transform transition-transform hover:scale-105 duration-300">
                                    <img src="${publicUrl}/image/qrcode.png" alt="GitHub Pages QR Code" 
                                         class="w-48 h-48 object-contain"
                                         onerror="this.parentElement.innerHTML='<div class=\'w-48 h-48 flex items-center justify-center text-gray-500\'>QR Code<br>Not Found</div>'">
                                </div>
                            </div>

                            <!-- Description Text -->
                            <div class="flex-1 space-y-5 text-lg leading-relaxed text-blue-50">
                                <p>
                                    전시장 네트워크 환경을 고려하여 현장에서는 로컬 데모를 운영 중이나, 
                                    <strong class="text-yellow-300">GitHub Pages</strong>를 통해 언제 어디서든 프로젝트를 경험하실 수 있도록 배포하였습니다.
                                </p>
                                <p>
                                    본 프로젝트는 <strong>3D WebGL 렌더링</strong> 및 <strong>실시간 유체 시뮬레이션</strong> 연산을 수행하므로, 
                                    원활한 체험을 위해 <strong>16GB 이상의 RAM</strong>이 탑재된 PC 환경을 권장합니다.
                                </p>
                                
                                <!-- Warning Box -->
                                <div class="bg-red-900/30 p-5 rounded-xl border-l-4 border-red-400 text-sm text-red-100 mt-2">
                                    <strong class="text-white block mb-1 text-base">⚠️ 모바일 미지원 알림</strong>
                                    이 프로젝트는 PC 웹캠 기반의 인터랙션에 최적화되어 있습니다.<br>
                                    스마트폰으로 위 QR 코드를 스캔하여 링크를 복사한 뒤, 반드시 <strong>웹캠이 있는 데스크톱/노트북</strong>에서 접속해 주시기 바랍니다.
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                
                <!-- Portfolio -->
                <h2 class="${animClass} text-4xl font-bold mt-24 mb-10 text-white text-center drop-shadow-md">Portfolio</h2>
                <div class="${animClass} flex justify-center mb-24">
                    ${createPortfolioCard('portfolio.jpg', '포트폴리오 이미지', true)}
                </div>

            </div>
        </div>
    `;

    // --- 스크롤 애니메이션 로직 ---
    const observerOptions = {
        threshold: 0.1, 
        rootMargin: '0px 0px -30px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.remove('opacity-0', 'translate-y-10');
                entry.target.classList.add('opacity-100', 'translate-y-0');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const scrollElements = container.querySelectorAll('.js-scroll');
    scrollElements.forEach((el) => observer.observe(el));

    return () => {
        observer.disconnect();
        container.innerHTML = '';
    };
}