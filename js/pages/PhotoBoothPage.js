import { router } from '../router.js';
import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

/**
 * 포토부스 및 방명록 페이지
 * 1. 이름 입력 받기 (UI)
 * 2. 입력된 이름과 함께 3D 크레딧 롤 실행 (Three.js)
 */
export function PhotoBoothPage(container) {
    
    // 3D 씬 관련 변수
    let scene, camera, renderer, animationId;
    const clock = new THREE.Clock();

    // 크레딧 데이터 (수정 가능)
    const creditData = {
        header: [
            "기획 : 권유빈",
            "개발 : 권유빈"
        ],
        thanks: [
            "Thanks to",
            "아이디어를 제공해주시고, 밤낮으로 도와주신",
            "김종현 교수님 항상 감사드립니다.",
            " ",
            "양질의 피드백을 주시고 관심으로 바라봐주신",
            "성보경 교수님, 김윤정 교수님, 이덕찬 교수님께 감사드립니다.",
            " ",
            "항상 무한한 지지를 보내주는",
            "엄마, 아빠 그리고 할머니 할아버지 민서 항상 감사합니다."
        ],
        visitorsHeader: "그리고 보러와주신",
        // (여기에 입력받은 이름들이 추가됩니다)
        visitors: [],
        footer: "감사합니다."
    };

    // --- 1. HTML 뼈대 (입력 UI + 3D 캔버스 컨테이너) ---
    container.innerHTML = `
        <div class="guestbook-container relative flex items-center justify-center h-screen w-screen bg-gradient-to-br from-gray-900 to-slate-800 text-white font-sans overflow-hidden">
            
            <!-- 1. 이름 입력 폼 (Glassmorphism 스타일) -->
            <div id="guest-input-card" class="relative z-20 bg-white/10 backdrop-blur-lg border border-white/10 p-12 rounded-2xl shadow-xl max-w-md w-11/12 text-center">
                <h2 class="text-3xl font-bold mb-6 text-white">방명록 남기기</h2>
                <p class="text-gray-200 mb-8">당신의 이름을 남겨주세요.<br>이 전시의 마지막을 함께 장식합니다.</p>
                
                <div class="flex flex-col gap-4">
                    <input type="text" id="guest-name-input" 
                        class="w-full p-4 rounded-lg bg-black/20 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 transition-colors text-center text-lg"
                        placeholder="이름을 입력하세요" autocomplete="off">
                    
                    <button id="btn-show-credit" 
                        class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed">
                        크레딧 보기
                    </button>
                </div>
            </div>

            <!-- 2. 3D 크레딧 캔버스 컨테이너 (초기에는 숨김) -->
            <div id="credit-canvas-container" class="absolute top-0 left-0 w-full h-full z-10" style="display: none;"></div>
            
            <!-- (선택) 홈으로 가기 버튼 (크레딧 끝나면 표시) -->
            <button id="btn-go-home" class="absolute bottom-10 right-10 z-50 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-full backdrop-blur-md border border-white/10 transition-all" style="display: none;">
                처음으로
            </button>
        </div>
    `;

    // DOM 요소 참조
    const inputCard = container.querySelector('#guest-input-card');
    const nameInput = container.querySelector('#guest-name-input');
    const btnShowCredit = container.querySelector('#btn-show-credit');
    const canvasContainer = container.querySelector('#credit-canvas-container');
    const btnGoHome = container.querySelector('#btn-go-home');

    // --- 이벤트 핸들러 ---

    const handleShowCredit = async () => {
        const name = nameInput.value.trim();
        if (!name) {
            alert("이름을 입력해주세요!");
            return;
        }

        // [★수정★] LocalStorage 저장 로직 (최대 20명)
        try {
            // 1. 기존 명단 가져오기 (없으면 빈 배열)
            let storedVisitors = JSON.parse(localStorage.getItem('flowground_visitors') || '[]');
            
            // 2. 새 이름 추가
            storedVisitors.push(name);

            // 4. 저장
            localStorage.setItem('flowground_visitors', JSON.stringify(storedVisitors));

            // 5. 크레딧 데이터에 반영
            creditData.visitors = storedVisitors;
            
            console.log("방명록 저장 완료:", storedVisitors);
        } catch (e) {
            console.error("LocalStorage 저장 실패:", e);
            // 저장에 실패해도(예: 시크릿 모드 제한 등) 크레딧은 보여주도록 함
            creditData.visitors = [name]; 
        }

        // 2. UI 전환 (입력창 숨기기 -> 3D 캔버스 보이기)
        inputCard.style.transition = "opacity 0.5s ease, transform 0.5s ease";
        inputCard.style.opacity = "0";
        inputCard.style.transform = "scale(0.9)";
        
        setTimeout(() => {
            inputCard.style.display = 'none';
            canvasContainer.style.display = 'block';
            
            // 3. 3D 크레딧 씬 시작
            initCreditScene();
        }, 500);
    };

    const handleGoHome = () => {
        router.navigate('/');
    };

    // 리스너 등록
    btnShowCredit.addEventListener('click', handleShowCredit);
    btnGoHome.addEventListener('click', handleGoHome);

    // 엔터키 입력 지원
    nameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleShowCredit();
    });


    // --- 3D 크레딧 씬 구현 (다음 단계에서 상세 구현) ---
    async function initCreditScene() {
        console.log("크레딧 씬 시작...");
        // TODO: 여기에 3D 글씨 생성 및 카메라 애니메이션 로직 구현 예정
        
        // (임시) 배경색만 변경하여 씬 시작 확인
        // canvasContainer.style.backgroundColor = "black";
        
        // 3D 로직은 다음 스텝에서 작성하겠습니다.
        // 1. Scene, Camera, Renderer 설정
        // 2. FontLoader로 폰트 로드
        // 3. creditData를 순회하며 TextGeometry 생성 및 Y축 배치
        // 4. animate 루프에서 카메라를 나선형(Helix)으로 이동
    }

    // 정리(cleanup) 함수
    return () => {
        if (animationId) cancelAnimationFrame(animationId);
        if (renderer) renderer.dispose();
        container.innerHTML = '';
    };
}