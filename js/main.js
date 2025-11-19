import EventBus from "./utils/EventBus";
// window.EventBus = EventBus; // event bus 글로벌로 등록, event 발행 구독하면서 모듈 간 통신 역할
import WebGL from './modules/WebGL.js';
import { router } from "./router.js";
import { AboutPage } from "./pages/AboutPage.js";
import { LandingPage } from "./pages/LandingPage.js";
import { TutorialPage } from "./pages/TutorialPage.js";
import { PracticePage } from "./pages/PracticePage.js";
import { PhotoBoothPage } from "./pages/PhotoBoothPage.js";


// [추가] VideoManager 임포트
import VideoManager from './modules/VideoManager.js';

// 개발 환경 플래그 설정
if (!window.isDev) window.isDev = false; // is dev 정의되어있지 않으면 개발환경을 끔. (디버그 용 코드드 한번에 꺼버리기)
const publicUrl = process.env.PUBLIC_URL || '';


/**
 * WebGL 시뮬레이션을 렌더링하는 메인 페이지 컴포넌트입니다.
 * @param {HTMLElement} container - 페이지가 렌더링될 DOM 요소
 * @returns {Function} 페이지가 사라질 때 호출될 정리(cleanup) 함수
 */
function MainPage(container) {
    // [중요] container에 relative를 주어 내부 absolute 요소들이 이 영역 안에서만 배치되도록 합니다.
    container.classList.add('relative', 'w-full', 'h-full');

    // 1. WebGL 인스턴스 생성 (Canvas가 container에 append됨)
    let webglInstance = new WebGL({
        $wrapper: container
    });

    // 2. [추가] 하단 안내 문구 생성
    const disclaimerDiv = document.createElement('div');
    
    // 스타일: 
    // - absolute bottom-4: 컨테이너 하단에 고정
    // - pointer-events-none: 문구 위를 클릭해도 뒤의 시뮬레이션이 반응하도록 통과시킴
    disclaimerDiv.className = "absolute top-32 left-0 w-full flex justify-center z-10 pointer-events-none px-4";
    
    disclaimerDiv.innerHTML = `
        <div class="bg-gray-900/40 backdrop-blur-sm p-4 rounded-xl font-sans text-center max-w-4xl border border-white/5 shadow-lg">
            <p class="text-gray-100 text-[10px] sm:text-xs font-bold leading-relaxed break-keep">
                해당 페이지는 제스처 클릭을 지원하지 않습니다. 또한 모니터 사양이 낮아 느린 점 양해부탁드립니다!
            </p>
            <p class="text-gray-100 text-[10px] sm:text-xs font-light leading-relaxed break-keep">
                구현된 연기의 움직임은 아직 풀지 못한 문제들을 일컫는 밀레니엄 문제 중 하나인 
                <span class="text-indigo-800 font-medium">나비에 스토크스 방정식</span>을 기반으로 합니다.<br class="hidden sm:block"/>
                따라서 완벽한 '해', '정답' 대신 수치해석 기법을 사용하기 때문에 
                마치 시간의 윤년처럼 아주 작은 오차들이 쌓여 시스템이 불안정해집니다.
            </p>
            <p class="text-indigo-100 text-xs sm:text-sm font-medium mt-1 animate-pulse">
                따라서 멈춰있다면, 새로고침하거나 상단 바의 타이틀 flowground를 눌러주세요.
            </p>
        </div>
        <div class="absolute top-80 left-10 z-20 font-sans pointer-events-auto">
            <div class="flex flex-col items-start gap-3 p-5 bg-gray-900/60 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl transition-transform hover:scale-105">
                
                <button id="btn-enable-webcam" class="group relative flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold px-6 py-3 rounded-xl shadow-lg transition-all duration-200 w-full overflow-hidden">
                    <span class="relative z-10 flex items-center gap-2">
                        <span>📷</span> 
                        <span id="btn-text">웹캠 배경 켜기</span>
                    </span>
                    <!-- 호버 시 빛나는 효과 -->
                    <div class="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                </button>
                
                <div class="flex items-start gap-2 px-1">
                    <span class="text-yellow-400 text-sm mt-0.5 animate-bounce">💡</span>
                    <p class="text-indigo-100 text-xs font-medium leading-relaxed opacity-90">
                        증강 현실 효과를 위해<br/>
                        <span class="text-white border-b border-white/20 pb-0.5">웹캠 배경</span>을 켜보세요!
                    </p>
                </div>
            </div>
        </div>
    `;
    
    // HTML을 컨테이너에 추가
    container.appendChild(disclaimerDiv);

    // [로직 추가] 버튼 클릭 이벤트 리스너
    const enableWebcamBtn = disclaimerDiv.querySelector('#btn-enable-webcam');
    let isWebcamActive = false; // 현재 상태 추적 변수

    enableWebcamBtn.addEventListener('click', async () => {
        try {
            let videoElement = VideoManager.getElement();

            if (!isWebcamActive) {
                // --- 켜기 (ON) ---
                console.log("웹캠 켜기 시도...");

                // 1. 비디오 요소가 없으면 초기화 및 시작
                if (!videoElement) {
                    console.log("VideoManager 초기화 및 카메라 시작...");
                    VideoManager.init(document.body, window.innerWidth, window.innerHeight);
                    await VideoManager.startCamera();
                    videoElement = VideoManager.getElement();
                }

                // 2. 투명도를 1로 설정 (보이게 하기)
                if (typeof VideoManager.setVideoOpacity === 'function') {
                    VideoManager.setVideoOpacity('0.4'); 
                }
                // 3. 버튼 상태 업데이트 (끄기 모드로 전환)
                // [중요] disabled = true를 하지 않습니다!
                isWebcamActive = true;
                enableWebcamBtn.textContent = "웹캠 배경 끄기";
                enableWebcamBtn.classList.remove('bg-blue-600', 'hover:bg-blue-500');
                enableWebcamBtn.classList.add('bg-gray-600', 'hover:bg-gray-500');

            } else {
                // --- 끄기 (OFF) ---
                console.log("웹캠 배경 끄기 시도...");

                // 1. 투명도를 0으로 설정하여 숨김
                if (typeof VideoManager.setVideoOpacity === 'function') {
                    VideoManager.setVideoOpacity(0);
                }
                if (videoElement) {
                    videoElement.style.opacity = '0';
                    videoElement.classList.remove('opacity-100');
                    videoElement.classList.add('opacity-0');
                }

                // 2. 버튼 상태 업데이트 (켜기 모드로 전환)
                isWebcamActive = false;
                enableWebcamBtn.textContent = "웹캠 배경 켜기";
                enableWebcamBtn.classList.remove('bg-gray-600', 'hover:bg-gray-500');
                enableWebcamBtn.classList.add('bg-blue-600', 'hover:bg-blue-500');
            }

        } catch (error) {
            console.error("웹캠 제어 실패:", error);
            // 에러가 났을 때만 버튼을 비활성화합니다.
            enableWebcamBtn.textContent = "웹캠 오류";
            enableWebcamBtn.disabled = true;
            enableWebcamBtn.classList.add('opacity-50', 'cursor-not-allowed');
        }
    });


    // 페이지 정리 함수
    return () => {
        if (webglInstance && webglInstance.destroy) {
            webglInstance.destroy(); // WebGL 리소스 정리
        }
        webglInstance = null;
        
        // [중요] 페이지를 나갈 때 웹캠을 다시 숨김 (선택 사항)
        // 다른 페이지(Tutorial 등)에서도 써야 한다면 끄지 않아도 되지만,
        // 보통 메인 시뮬레이션 배경용으로 켰다면 끄는 게 깔끔합니다.
        const video = VideoManager.getElement();
        if (video) {
            video.style.opacity = '0';
        }

        container.innerHTML = '';
        container.classList.remove('relative', 'w-full', 'h-full');
    };
}

// '활성' 링크에 적용할 Tailwind 클래스 (파란색 도형)
const activeClasses = ['bg-blue-800', 'text-white'];
// '비활성' 링크에 적용할 기본 Tailwind 클래스
const defaultClasses = ['text-blue-800', 'hover:underline'];

/**
 * Nav Bar 상태를 업데이트하는 헬퍼 함수
 * @param {string} pathname - 현재 브라우저의 경로
 */
function updateNav(pathname) {
    // 1. 왼쪽 'Tutorial' 링크 제어
    const tutorialLink = document.getElementById('nav-tutorial-link');
    if (tutorialLink) {
        // '/simulation' 또는 '/practice'일 때 'Tutorial' 링크 표시
        if (pathname === '/simulation' || pathname === '/practice') {
            tutorialLink.classList.remove('hidden');
        } else {
            tutorialLink.classList.add('hidden');
        }
    }

    // 2. 오른쪽 'Main', 'About', 'Photo' 링크 활성 상태 제어
    const navLinks = document.querySelectorAll('.main-nav-link');

    navLinks.forEach(link => {
        const href = link.getAttribute('href');

        // 1. 먼저 모든 링크를 '비활성' 상태로 초기화
        link.classList.remove(...activeClasses);
        link.classList.add(...defaultClasses);

        // 2. 현재 경로(pathname)와 일치하는 링크를 찾아 '활성' 상태로 만듦
        if (href === pathname) {
            link.classList.remove(...defaultClasses);
            link.classList.add(...activeClasses);
        }
    });
}

if (typeof router.init === 'function') {
    router.init(publicUrl);
} else {
    console.warn("router.init() 함수가 없습니다. router.js를 확인하세요.");
    router.publicUrl = publicUrl; // fallback
}

EventBus.on('routeChanged', (event) => { // (변경) 'subscribe' -> 'on'
    // CustomEvent를 사용하므로, 데이터는 event.detail 안에 있습니다.
    updateNav(event.detail.pathname); // (변경) 'data.pathname' -> 'event.detail.pathname'
});

// 1. 라우트(경로)와 페이지 컴포넌트를 등록합니다.
router.addRoute("/", LandingPage); // MainPage 대신 위에서 정의한 mainPage 함수를 사용합니다.
router.addRoute("/about", AboutPage);
router.addRoute("/simulation", MainPage);
router.addRoute("/tutorial", TutorialPage);
router.addRoute("/practice", PracticePage); // TODO: 연습 페이지 컴포넌트로 변경 필요
router.addRoute("/photobooth", PhotoBoothPage);

// 2. 네비게이션 링크(<a data-link>) 클릭 이벤트를 처리합니다.
document.addEventListener("click", e => {
    // 1. 클릭된 요소가 <a> 태그이거나, <a>의 자식 요소인지 확인합니다.
    const anchor = e.target.closest('a');

    // 2. <a> 태그가 아니거나, href 속성이 없으면 무시합니다.
    if (!anchor) {
        return;
    }

    const href = anchor.getAttribute('href');

    // 3. 외부 링크(http), 앵커(#), 새 탭/창 링크는 브라우저 기본 동작에 맡깁니다.
    if (!href || href.startsWith('http') || href.startsWith('#') || anchor.target === '_blank') {
        return;
    }

    // 4. (중요) 브라우저의 기본 페이지 이동(새로고침)을 막습니다.
    e.preventDefault();

    let internalPath = href;

    // 5. 만약 링크(href)에 이미 publicUrl(예: /WebProject/simulation)이 포함되어 있다면,
    //    publicUrl 부분을 제거하여 순수 내부 경로(예: /simulation)만 남깁니다.
    if (href.startsWith(publicUrl) && publicUrl !== '') {
        internalPath = href.substring(publicUrl.length);
    }

    // 6. 내부 경로가 '/'로 시작하지 않으면(예: 'page.html'), SPA 라우트 대상이 아니므로 무시합니다.
    if (!internalPath.startsWith('/')) {
        console.warn(`Ignoring relative link: ${href}`);
        return;
    }

    // 7. 계산된 내부 경로로 라우터를 통해 이동합니다.
    router.navigate(internalPath); // 'internalPath'는 /simulation 같은 순수 경로
});

// 3. 브라우저의 뒤로가기/앞으로가기 버튼을 처리합니다.
window.addEventListener("popstate", () => {
    const pathname = location.pathname; // [수정] pathname 변수 추출
    router.loadRoute(pathname);
});

// 4. 페이지에 처음 접속했을 때, 현재 URL에 맞는 페이지를 로드합니다.
document.addEventListener("DOMContentLoaded", () => {
    const appContainer = document.getElementById('app');
    if (!appContainer) {
        console.error("라우터 컨테이너(#app)를 찾을 수 없습니다.");
        return;
    }
    const pathname = location.pathname || "/"; // [수정] pathname 변수 추출
    router.loadRoute(pathname, appContainer); // <-- 컨테이너를 전달 
});

