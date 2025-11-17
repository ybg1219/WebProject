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
    // WebGL 인스턴스를 저장할 변수
    let webglInstance = new WebGL({
        $wrapper: container
    });

    // 페이지가 변경될 때 호출될 정리(cleanup) 함수를 반환합니다.
    return () => {
        if (webglInstance && webglInstance.destroy) {
            webglInstance.destroy(); // WebGL 리소스 정리
        }
        webglInstance = null;
        // 컨테이너 내용을 비워 다음 페이지를 준비합니다.
        container.innerHTML = '';
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

