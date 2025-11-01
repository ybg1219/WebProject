// /pages/PracticePage.js (신규 파일)
import { router } from '../router.js';

/**
 * 프랙티스 페이지
 */
export function PracticePage(container) {
    container.innerHTML = `
        <div class="practice-container">
            <h1>프랙티스 페이지</h1>
        </div>
    `;
    

    // 정리 함수
    return () => {
        container.innerHTML = '';
    };
}