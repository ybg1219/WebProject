// pages/PhotoBoothPage.js
import { router } from '../router.js';

/**
 * 포토부스 페이지
 */
export function PhotoBoothPage(container) {
    container.innerHTML = `
        <div class="photobooth-container">
            <h1>포토부스 페이지</h1>
        </div>
    `;
    

    // 정리 함수
    return () => {
        container.innerHTML = '';
    };
}