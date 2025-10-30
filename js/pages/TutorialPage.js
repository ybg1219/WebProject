// src/pages/TutorialPage.js (신규 파일)
import { router } from '../router.js';

/**
 * Phase 2: 튜토리얼 학습 페이지
 */
export function TutorialPage(container) {
    container.innerHTML = `
        <div class="tutorial-container">
            <h1>튜토리얼 페이지</h1>
            <p>(Day 3: 여기에 학습 1, 2, 3 UI 구현)</p>
            <button id="btn-practice">연습 페이지로 이동</button> 
        </div>
    `;
    
    const btnPractice = container.querySelector('#btn-practice');

    const handlePractice = () => {
        // TODO: (Day 4-5) '/practice' 경로로 이동
        // router.navigate('/practice');
        console.log("연습 페이지로 이동 (미구현)");
    };

    btnPractice.addEventListener('click', handlePractice);

    // 정리 함수
    return () => {
        btnPractice.removeEventListener('click', handlePractice);
        container.innerHTML = '';
    };
}