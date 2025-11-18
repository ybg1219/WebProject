import EventBus from "./utils/EventBus";
// window.EventBus = EventBus; // event bus 글로벌로 등록, event 발행 구독하면서 모듈 간 통신 역할
import WebGL from './modules/WebGL.js';
import { router } from "./router.js";
import { AboutPage } from "./pages/AboutPage.js";
import { LandingPage } from "./pages/LandingPage.js";
import { TutorialPage } from "./pages/TutorialPage.js";
import { PracticePage } from "./pages/PracticePage.js";
import { PhotoBoothPage } from "./pages/PhotoBoothPage.js";

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
        <div class="bg-gray-900/40 backdrop-blur-sm p-4 rounded-xl text-center max-w-4xl border border-white/5 shadow-lg">
            <p class="text-gray-100 text-[10px] sm:text-xs font-light leading-relaxed break-keep">
                구현된 연기의 움직임은 아직 풀지 못한 문제들을 일컫는 밀레니엄 문제 중 하나인 
                <span class="text-indigo-800 font-medium">나비에 스토크스 방정식</span>을 기반으로 합니다.<br class="hidden sm:block"/>
                따라서 완벽한 '해', '정답'을 대신 수치해석 기법을 사용하기 때문에 
                마치 시간의 윤년처럼 아주 작은 오차들이 쌓여 시스템이 불안정해집니다.
            </p>
            <p class="text-indigo-300 text-xs sm:text-sm font-medium mt-1 animate-pulse">
                따라서 멈춰있다면, 새로고침하거나 상단 바의 타이틀 flowground를 눌러주세요.
            </p>
        </div>
    `;
    
    // [중요] container 안에 넣습니다. 페이지가 바뀌면 container가 비워지므로 이 문구도 함께 사라집니다.
    container.appendChild(disclaimerDiv);


    // 페이지가 변경될 때 호출될 정리(cleanup) 함수를 반환합니다.
    return () => {
        if (webglInstance && webglInstance.destroy) {
            webglInstance.destroy(); // WebGL 리소스 정리
        }
        webglInstance = null;
        
        // [중요] 여기서 container 내부를 싹 비웁니다 (캔버스 + 안내 문구 모두 삭제됨)
        container.innerHTML = '';
        
        // 추가했던 클래스 제거 (선택사항, 깔끔한 상태 유지를 위해)
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

