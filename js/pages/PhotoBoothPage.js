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

    // [설정] 로컬 스토리지 키 이름
    const STORAGE_KEY = 'flowground_visitors';

    // [설정] 로컬 스토리지 오류 시 사용할 기본 방문자 목록 (Fallback)
    const defaultVisitors = [
        "Flowground Fan",
        "Media Art Lover",
        "Guest 001",
        "Happy Visitor",
        "Anonymous"
    ];

    // 이번 세션에서 추가한 방문자 목록 (임시 저장)
    let currentSessionVisitors = [];

    // 크레딧 데이터 (수정 가능)
    const creditData = {
        header: [
            "Flowground",
            "기획 : 권유빈",
            "개발 : 권유빈"
        ],
        thanks: [
            "Thanks to",
            " ",
            "아이디어를 제공해주시고,",
            "지난 3년 간 밤낮으로 도와주신",
            "김종현 교수님 항상 감사드립니다.",
            " ",
            "양질의 피드백을 주시고 관심으로 바라봐주신",
            "성보경 교수님, 김윤정 교수님, 이덕찬 교수님께 감사드립니다.",
            " ",
            "항상 무한한 지지를 보내주는",
            " 할머니 할아버지 민서 그리고 엄마, 아빠 항상 감사합니다."
        ],
        visitorsHeader: "그리고 보러와주신",
        visitors: [],
        footer: "감사합니다."
    };

    // --- 1. HTML 뼈대 (Glassmorphism 적용) ---
    container.innerHTML = `

        <style>
            .ui-fade-out {
                opacity: 0 !important;
                pointer-events: none !important;
                transform: scale(1.1);
            }
        </style>

        <div class="guestbook-container relative flex items-center justify-center h-screen w-screen bg-gradient-to-br from-blue-950 to-gray-900 text-white font-sans overflow-hidden">
            
            <!-- 1. 이름 입력 폼 -->
            <div id="guest-input-card" class="relative z-20 bg-white/10 backdrop-blur-lg border border-white/10 p-12 rounded-2xl shadow-xl max-w-md w-11/12 text-center">
                <h2 class="text-3xl font-bold mb-2 text-white">방명록 남기기</h2>
                <p class="text-gray-200 mb-8 text-lg">귀하의 이름을 남겨 크레딧을 장식해주세요.</p>
                
                <!-- 입력창과 추가 버튼 -->
                <div class="flex gap-2 mb-4">
                    <input type="text" id="guest-name-input" 
                        class="flex-1 p-4 rounded-lg bg-black/20 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 transition-colors text-left pl-4 text-lg"
                        placeholder="이름 입력" autocomplete="off">
                    
                    <!-- [수정] 보라색 Enter 아이콘 버튼 -->
                    <button id="btn-add-name" 
                        class="bg-indigo-600 hover:bg-indigo-500 text-white p-4 rounded-lg transition-all duration-200 flex items-center justify-center shadow-lg transform active:scale-95">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                </div>

                <!-- [신규] 추가된 이름 목록 표시 영역 -->
                <div id="added-names-list" class="flex flex-wrap gap-2 justify-center mb-8 min-h-[2rem]">
                    <!-- 뱃지가 여기에 추가됩니다 -->
                </div>
                
                <!-- [수정] 하얀색 크레딧 보기 버튼 -->
                <button id="btn-show-credit" 
                    class="w-full bg-white hover:bg-gray-100 text-indigo-900 font-bold py-4 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed">
                    크레딧 보기
                </button>

            </div>
            
            <button id="btn-reset-storage" class="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 text-xs text-gray-500 hover:text-red-400 underline transition-all duration-800 ease-in-out">
                방명록 초기화 (관리자용)
            </button>


            <!-- 2. 3D 크레딧 캔버스 컨테이너 -->
            <div id="credit-canvas-container" class="absolute top-0 left-0 w-full h-full z-10" style="display: none;"></div>
            
            <!-- 3. 하단 버튼 그룹 (크레딧 도중 표시) -->
            <div id="credit-controls" class="absolute bottom-10 right-10 z-50 flex gap-4 opacity-0 pointer-events-none transition-opacity duration-1000">
                <button id="btn-replay" class="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-full backdrop-blur-md border border-white/10 transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    다시보기
                </button>
                <button id="btn-go-home" class="bg-indigo-600/80 hover:bg-indigo-600 text-white px-6 py-3 rounded-full backdrop-blur-md border border-white/10 transition-all">
                    처음으로
                </button>
            </div>
        </div>
    `;

    // DOM 요소 참조
    const inputCard = container.querySelector('#guest-input-card');
    const nameInput = container.querySelector('#guest-name-input');
    const btnAddName = container.querySelector('#btn-add-name'); // [신규]
    const addedNamesList = container.querySelector('#added-names-list'); // [신규]
    const btnShowCredit = container.querySelector('#btn-show-credit');
    const btnResetStorage = container.querySelector('#btn-reset-storage');
    
    const canvasContainer = container.querySelector('#credit-canvas-container');
    const creditControls = container.querySelector('#credit-controls');
    const btnReplay = container.querySelector('#btn-replay');
    const btnGoHome = container.querySelector('#btn-go-home');

    // --- 이벤트 핸들러 ---

    // [신규] 이름 추가 핸들러
    const handleAddName = () => {
        const name = nameInput.value.trim();
        if (!name) return;

        // 중복 체크 (선택 사항)
        // if (currentSessionVisitors.includes(name)) {
        //     alert("이미 추가된 이름입니다.");
        //     nameInput.value = '';
        //     return;
        // }

        currentSessionVisitors.push(name);
        nameInput.value = ''; // 입력창 초기화
        nameInput.focus();

        renderAddedNames(); // UI 업데이트
    };

    // [신규] 추가된 이름 목록 렌더링
    const renderAddedNames = () => {
        addedNamesList.innerHTML = currentSessionVisitors.map(name => `
            <span class="px-3 py-1 bg-indigo-500/30 border border-indigo-400/50 rounded-full text-base text-indigo-100">
                ${name}
            </span>
        `).join('');
    };

    const handleResetStorage = () => {
        if (confirm("정말로 방명록 데이터를 초기화하시겠습니까?")) {
            localStorage.removeItem(STORAGE_KEY);
            creditData.visitors = [];
            currentSessionVisitors = [];
            renderAddedNames();
            alert("방명록이 초기화되었습니다.");
        }
    };

    const handleShowCredit = async () => {
        // 입력창에 남아있는 이름이 있으면 마저 추가
        const remainingName = nameInput.value.trim();
        if (remainingName && !currentSessionVisitors.includes(remainingName)) {
            currentSessionVisitors.push(remainingName);
        }

        // 이름이 하나도 없으면 경고
        // if (currentSessionVisitors.length === 0) {
        //     alert("이름을 입력해주세요!");
        //     return;
        // }

        // LocalStorage 저장 로직 (일괄 저장)
        try {
            let storedVisitors = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            
            // 이번 세션의 방문자들을 모두 추가
            currentSessionVisitors.forEach(visitor => {
                storedVisitors.push(visitor);
            });
            
            // 최대 30개 유지 (조금 늘림)
            if (storedVisitors.length > 50) {
                storedVisitors = storedVisitors.slice(storedVisitors.length - 50);
            }
            
            localStorage.setItem(STORAGE_KEY, JSON.stringify(storedVisitors));
            creditData.visitors = storedVisitors.reverse(); 

        } catch (e) {
            console.error("LocalStorage 저장 실패 (Fallback 사용):", e);
            const fallbackList = [...defaultVisitors, ...currentSessionVisitors];a
            creditData.visitors = fallbackList.reverse();
        }

        // [핵심] 별도 클래스(.ui-fade-out)를 추가하여 투명도 처리
        inputCard.classList.add('ui-fade-out');
        btnResetStorage.classList.add('ui-fade-out');
        
        setTimeout(() => {
            // 애니메이션 후 display: none 처리 (선택 사항, 3D 씬 성능 위해)
            inputCard.style.display = 'none';
            btnResetStorage.style.display = 'none';

            canvasContainer.style.display = 'block';
            initCreditScene();
            
            setTimeout(() => {
                if (creditControls) {
                    creditControls.style.opacity = '1';
                    creditControls.style.pointerEvents = 'auto';
                }
            }, 5000);
        }, 800);
    };

    const handleGoHome = () => {
        router.navigate('/');
    };

    // 리스너 등록
    btnAddName.addEventListener('click', handleAddName); // [신규]
    btnShowCredit.addEventListener('click', handleShowCredit);
    btnResetStorage.addEventListener('click', handleResetStorage);
    btnGoHome.addEventListener('click', handleGoHome);
    
    nameInput.addEventListener('keypress', (e) => {
        // 엔터키 누르면 '추가' 버튼 클릭과 동일하게 동작
        if (e.key === 'Enter') handleAddName();
    });


    // --- 3D 크레딧 씬 구현 ---
    async function initCreditScene() {
        console.log("크레딧 씬 시작...");
        
        const width = window.innerWidth;
        const height = window.innerHeight;

        // 1. 씬 설정
        scene = new THREE.Scene();
        
        camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        camera.position.set(0, 0, 20); 

        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        canvasContainer.appendChild(renderer.domElement);
        

        // 조명
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); 
        scene.add(ambientLight);
        const pointLight = new THREE.PointLight(0xffffff, 1, 100);
        pointLight.position.set(10, 10, 10);
        scene.add(pointLight);

        // 2. 폰트 로드
        const fontLoader = new FontLoader();
        const fontPath = `${process.env.PUBLIC_URL}fonts/noto_sans_kr_bold.typeface.json`; 

        try {
            const font = await fontLoader.loadAsync(fontPath);
            createCredits(font);
            clock.start(); 
            animate();
        } catch (err) {
            console.error("폰트 로드 실패:", err);
        }

        const handleReplay = () => {
            console.log("크레딧 다시보기");
            clock.start(); 
            creditControls.style.opacity = '0';
            creditControls.style.pointerEvents = 'none';
            setTimeout(() => {
                creditControls.style.opacity = '1';
                creditControls.style.pointerEvents = 'auto';
            }, 5000);
        };
        btnReplay.onclick = handleReplay;


        // 3. 텍스트 생성 함수
        function createCredits(font) {
            const material = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 });
            const highlightMaterial = new THREE.MeshBasicMaterial({ color: 0x4f46e5, transparent: true, opacity: 1.0 }); 

            let currentY = -5; 
            const lineHeight = 1.0; 
            const sectionGap = 2.4;

            const addText = (text, size, mat = material) => {
                const geometry = new TextGeometry(text, {
                    font: font,
                    size: size,
                    height: 0.15, 
                    curveSegments: 6, 
                    bevelEnabled: false
                });
                geometry.center(); 
                const mesh = new THREE.Mesh(geometry, mat);
                mesh.position.y = currentY;
                scene.add(mesh);
                return mesh;
            };

            // --- 크레딧 배치 ---
            creditData.header.forEach((text, i) => {
                const isTitle = i === 0 || i === 3; 
                addText(text, isTitle ? 0.7 : 0.3, isTitle ? highlightMaterial : material);
                currentY -= (isTitle ? lineHeight * 1.2 : lineHeight);
            });
            currentY -= sectionGap;

            creditData.thanks.forEach(text => {
                const isHeader = text.includes("Thanks");
                addText(text, isHeader ? 0.7 : 0.3, isHeader ? highlightMaterial : material);
                currentY -= lineHeight;
            });
            currentY -= sectionGap;

            addText(creditData.visitorsHeader, 0.5, highlightMaterial);
            currentY -= lineHeight * 2;

            creditData.visitors.forEach(name => {
                addText(name, 0.3, material); 
                currentY -= lineHeight * 0.9;
            });
            
            currentY -= sectionGap;
            addText(creditData.footer, 0.9, highlightMaterial);
        }

        // 4. 애니메이션 루프
        function animate() {
            animationId = requestAnimationFrame(animate);
            const time = clock.getElapsedTime();

            const descentSpeed = 1.7;
            const rotationSpeed = 0.02;
            const radius = 15;

            camera.position.y = -time * descentSpeed;
            camera.position.x = -2.0 + Math.sin(time * rotationSpeed) * radius;
            camera.position.z = Math.cos(time * rotationSpeed) * radius;

            camera.lookAt(0, camera.position.y +2, 0);

            renderer.render(scene, camera);
        }
        
        const onWindowResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', onWindowResize);
    }

    return () => {
        if (animationId) cancelAnimationFrame(animationId);
        if (renderer) {
            renderer.dispose();
        }
        if (btnResetStorage) btnResetStorage.removeEventListener('click', handleResetStorage);
        if (btnShowCredit) btnShowCredit.removeEventListener('click', handleShowCredit);
        if (btnAddName) btnAddName.removeEventListener('click', handleAddName);
        if (btnGoHome) btnGoHome.removeEventListener('click', handleGoHome);
        
        container.innerHTML = '';
    };
}