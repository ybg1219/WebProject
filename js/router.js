import EventBus from './utils/EventBus.js';

/**
 * 앱의 기본 경로(Base Path).
 * 예: 로컬("/", "gh-pages("/WebProject")
 * 이 값은 main.js의 router.init(publicUrl)을 통해 주입됩니다.
 */
let BASE = "/"; 

const routes = {}; // 라우트 "목차" (순수 경로만 저장)
let currentPageCleanup = null; // 현재 페이지의 정리 함수

export const router = {

    /**
     * main.js에서 process.env.PUBLIC_URL 값을 받아 BASE를 설정합니다.
     * @param {string} publicUrl 
     */
    init(publicUrl) {
        BASE = publicUrl || "/";
        console.log(`Router initialized with BASE: ${BASE}`);
    },

    /**
     * 라우트 "목차"에 페이지 컴포넌트를 등록합니다.
     * @param {string} path - 순수 내부 경로 (예: "/", "/about")
     * @param {Function} pageComponent - 페이지 렌더링 함수
     */
    addRoute(path, pageComponent) {
        routes[path] = pageComponent;
    },

    /**
     * 브라우저의 전체 URL(fullPath)을 "목차"에서 찾을 내부 경로(path)로 변환합니다.
     * @param {string} fullPath - 예: "/WebProject/simulation"
     * @returns {string} - 예: "/simulation"
     */
    normalizePath(fullPath) {
        // BASE가 "/"인 경우 (로컬 dev)은 그대로 사용
        if (BASE === "/") return fullPath || "/"; // fullPath가 ""일 경우 /로
        
        // GitHub Pages: /WebProject/simulation → /simulation
        if (fullPath.startsWith(BASE)) {
            const withoutBase = fullPath.replace(BASE, "");
            return withoutBase === "" ? "/" : withoutBase; // /WebProject/ → /
        }
        
        // BASE 경로가 아닌 URL(예: /)로 접근 시 /로 강제
        if (fullPath === "/") return "/"; 
        
        console.warn(`Path mismatch: ${fullPath} does not match BASE ${BASE}. Fallback to root.`);
        return "/"; // 예외 상황 시 루트로
    },

    /**
     * 실제 페이지를 로드하고 렌더링합니다.
     * @param {string} fullPath - 브라우저의 location.pathname (예: "/WebProject/simulation")
     */
    loadRoute(fullPath) {
        // 1. 전체 URL을 내부 경로로 변환
        const path = this.normalizePath(fullPath);
        
        const appContainer = document.querySelector("#app");
        if (!appContainer) {
            console.error("#app not found");
            return;
        }

        // 2. 이전 페이지 정리 함수 실행
        if (currentPageCleanup) {
            currentPageCleanup();
            currentPageCleanup = null;
        }

        // 3. "목차"에서 새 페이지 컴포넌트를 찾음
        const pageComponent = routes[path];

        if (!pageComponent) {
            console.error("없는 route:", path, "(Original:", fullPath, ")");
            // 404 Fallback: "/" (루트) 페이지로 이동
            if (routes["/"]) {
                // 루트로 강제 이동 (URL도 변경)
                this.navigate("/"); 
            }
            return;
        }
        
        // 4. 새 페이지 렌더링 및 정리 함수 저장
        currentPageCleanup = pageComponent(appContainer, this); // router 자신을 전달 (LandingPage 등에서 navigate 사용)
        
        // 5. Nav 업데이트 등을 위해 이벤트 발행
        EventBus.emit('routeChanged', { pathname: path });
    },

    /**
     * SPA 방식으로 페이지를 이동합니다.
     * @param {string} path - 순수 내부 경로 (예: "/simulation")
     */
    navigate(path) {
        // 1. 내부 경로를 브라우저에 표시할 전체 URL로 변환
        // (BASE가 "/"이고 path가 "/simulation" -> "/simulation")
        // (BASE가 "/WebProject"이고 path가 "/simulation" -> "/WebProject/simulation")
        const fullPath = (BASE === "/" ? "" : BASE) + path;
        
        // 2. 브라우저 history 스택에 추가 (URL 변경)
        history.pushState(null, null, fullPath);
        
        // 3. 페이지 렌더링
        this.loadRoute(fullPath);
    }
};
