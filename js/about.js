/**
 * 간단한 텍스트를 보여주는 'About' 페이지 컴포넌트
 * @param {HTMLElement} container - 페이지가 렌더링될 DOM 요소
 * @returns {Function} 페이지가 사라질 때 호출될 정리(cleanup) 함수
 */
export function AboutPage(container) {
    container.innerHTML = `
        <div style="color: white; padding: 20px;">
            <h1>About This Project</h1>
            <p>이 프로젝트는 Three.js와 MediaPipe를 이용한 실시간 유체 시뮬레이션입니다.</p>
        </div>
    `;

    // 이 페이지는 특별히 정리할 내용이 없으므로, 컨테이너만 비웁니다.
    return () => {
        container.innerHTML = '';
    };
}
