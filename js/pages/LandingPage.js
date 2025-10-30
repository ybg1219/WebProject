// src/pages/LandingPage.js
import { router } from '../router.js'; 
// MediaPipe 카메라 권한 헬퍼가 있다면 가져옵니다.
// import { requestCameraPermission } from '../utils/mediaPipeHelper.js';

/**
 * Phase 1: 랜딩 페이지 컴포넌트
 * - 타이틀 애니메이션
 * - 카메라 권한 요청
 * - 튜토리얼 프롬프트
 */
export function LandingPage(container) {
    // 1. HTML 뼈대 렌더링
    container.innerHTML = `
        <div class="landing-container">
            <h1 class="title-animation">flowground</h1>
            
            <div class="prompt" style="display: none;">
                <h2>튜토리얼을 보시겠습니까?</h2>
                <p>손동작으로 연기를 다루는 방법을 배웁니다.</p>
                <button id="btn-tutorial-yes">예 (학습하기)</button>
                <button id="btn-tutorial-no">아니오 (바로 시작)</button>
            </div>

            <div class="permission-message" style="display: none;">
                <p>손동작 인식을 위해 카메라 권한이 필요합니다.<br>권한을 허용해주세요.</p>
            </div>

            <div class="permission-denied" style="display: none;">
                <p>카메라 권한이 거부되었습니다.<br>브라우저 설정을 변경 후 새로고침 해주세요.</p>
            </div>
        </div>
    `;

    // 2. DOM 요소 참조
    const title = container.querySelector('.title-animation');
    const prompt = container.querySelector('.prompt');
    const btnYes = container.querySelector('#btn-tutorial-yes');
    const btnNo = container.querySelector('#btn-tutorial-no');
    const permMessage = container.querySelector('.permission-message');
    const permDenied = container.querySelector('.permission-denied');

    // 3. 이벤트 핸들러 정의
    const handleYes = () => {
        // TODO: (Day 3) '/tutorial' 경로로 변경
        // router.navigate('/tutorial'); 
        console.log("튜토리얼 페이지로 이동 (미구현)");
    };
    
    const handleNo = () => {
        router.navigate('/simulation'); // Phase 3 (메인 시뮬레이션)으로 바로 이동
    };

    // 4. 페이지 진입 로직 실행
    const runPhase1 = async () => {
        // TODO: (Day 8-9) 타이틀 애니메이션 실행
        // await playTitleAnimation(title);
        // await playParticleScatter(title);
        
        // (임시) 2초 후 애니메이션 끝났다고 가정
        await new Promise(resolve => setTimeout(resolve, 2000));
        title.style.display = 'none'; // 타이틀 숨김

        // (임시) 권한 요청 UI 표시
        permMessage.style.display = 'block';
        
        // TODO: 실제 카메라 권한 요청 로직
        try {
            // await requestCameraPermission(); // 실제 MediaPipe 권한 요청
            
            // (임시) 성공했다고 가정
            console.log("카메라 권한 획득 (가상)");
            permMessage.style.display = 'none';
            prompt.style.display = 'block'; // 튜토리얼 프롬프트 표시

            // 버튼에 이벤트 리스너 연결
            btnYes.addEventListener('click', handleYes);
            btnNo.addEventListener('click', handleNo);

        } catch (error) {
            // 권한 요청 실패 시
            console.error("카메라 권한 거부됨", error);
            permMessage.style.display = 'none';
            permDenied.style.display = 'block';
        }
    };

    runPhase1(); // 로직 실행

    // 5. 정리(cleanup) 함수 반환
    return () => {
        btnYes.removeEventListener('click', handleYes);
        btnNo.removeEventListener('click', handleNo);
        container.innerHTML = ''; // 페이지 나갈 때 DOM 정리
    };
}