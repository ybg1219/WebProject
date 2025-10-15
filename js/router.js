// 라우트(경로-페이지 매핑) 정보를 저장할 객체
const routes = {};
// 현재 페이지의 리소스를 정리(cleanup)하는 함수를 저장할 변수
let currentPageCleanup = null;

/**
 * 라우터 객체
 */
export const router = {
    /**
     * 라우트를 등록하는 함수
     * @param {string} path - URL 경로 (예: "/")
     * @param {Function} pageComponent - 해당 경로에 렌더링할 페이지 컴포넌트 함수
     */
    addRoute(path, pageComponent) {
        routes[path] = pageComponent;
    },

    /**
     * URL 경로에 맞는 페이지를 로드하고 렌더링하는 함수
     * @param {string} path - 이동할 URL 경로
     */
    loadRoute(path) {
        const appContainer = document.querySelector("#app");
        if (!appContainer) {
            console.error("#app 요소를 찾을 수 없습니다.");
            return;
        }
        
        // 1. 이전 페이지의 정리(cleanup) 함수가 있다면 실행하여 리소스를 해제합니다.
        if (currentPageCleanup) {
            currentPageCleanup();
            currentPageCleanup = null;
        }

        // 2. 경로에 맞는 페이지 컴포넌트를 찾습니다. 없으면 홈페이지로 이동합니다.
        const page = routes[path] || routes["/"];

        // 3. 새 페이지를 렌더링하고, 반환된 정리 함수를 저장합니다.
        currentPageCleanup = page(appContainer);
    },

    /**
     * history.pushState를 사용하여 페이지를 이동하는 함수 (새로고침 없음)
     * @param {string} path - 이동할 경로
     */
    navigate(path) {
        history.pushState(null, null, path);
        this.loadRoute(path);
    }
};
