import { router } from '../router.js';
import VideoManager from '../modules/VideoManager.js'; // 1. VideoManager 임포트
import GestureTracking from '../modules/GestureTracking.js';       // 2. GestureTracking 모듈 임포트
import VirtualMouse from '../modules/VirtualMouse.js';          // 3. VirtualMouse 모듈 임포트

// Three.js 모듈 임포트 (Webpack/npm 경로로 수정)
import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js';

import helvetikerFontData from 'three/examples/fonts/helvetiker_regular.typeface.json';
/**
 * Phase 1: 랜딩 페이지 컴포넌트
 * - 타이틀 애니메이션
 * - 카메라 권한 요청 (VideoManager)
 * - 손 추적 및 가상 커서 활성화 (GestureTracking, VirtualMouse)
 * - 튜토리얼 프롬프트
 */
export function LandingPage(container) {

    let shouldCleanupTracking = true; // 트래킹 모듈 정리 여부 플래그
    // 1. HTML 뼈대 렌더링
    container.innerHTML = `
        <!-- 
          전체 화면을 채우는 다크 모드 컨테이너 (bg-gray-900)
          모든 자식 요소를 중앙 정렬합니다 (flex, items-center, justify-center)
        -->
        <div class="landing-container flex items-center justify-center h-screen w-screen bg-gradient-to-r from-blue-400 to-blue-600 text-slate-50 font-sans overflow-hidden">
   
            <!-- 
              1. 3D 애니메이션으로 대체될 H1 타이틀
                 (애니메이션 재생 전까지 임시로 펄스 효과를 줍니다)
            -->
            <h1 class="title-animation text-6xl md:text-8xl font-bold text-indigo animate-pulse">flowground</h1>
            
            <!-- 
              2. 튜토리얼 프롬프트 (카드 디자인)
                 - bg-blue-800: 배경색
                 - rounded-lg, shadow-xl: 둥근 모서리와 그림자
                 - p-8: 패딩
                 - max-w-md, w-full: 최대 너비 고정, 모바일에선 꽉 차게
            -->
            <div class="prompt relative z-10 bg-slate-300/20 backdrop-blur-lg border border-white/10 p-12 rounded-2xl shadow-xl max-w-2xl w-11/12 text-center" style="display: none;">
                <h2 class="text-white text-3xl font-bold mb-4">튜토리얼이 필요하신가요?</h2>
                <p class="text-gray-200 mb-10"> 제스처를 이용해 웹페이지를 탐험하기 위한 튜토리얼입니다.</p>
                <div class="flex flex-col sm:flex-row gap-12 justify-center">
                    <button id="btn-tutorial-yes" class="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold py-6 px-8 rounded-lg transition-colors duration-200">
                        예 (학습하기)
                    </button>
                    <button id="btn-tutorial-no" class="w-full sm:w-auto bg-slate-100/70 hover:bg-slate-100 text-blue-900 font-semibold py-3 px-6 rounded-lg transition-colors duration-200">
                        아니오 (바로 시작)
                    </button>
                </div>
            </div>

            <!-- 
              3. 카메라 권한 요청 메시지 (카드 디자인)
                 (권한을 기다리는 동안 스피너를 표시합니다)
            -->
            <div class="permission-message z-10 bg-slate-300/10 backdrop-blur-lg border border-white/10 p-12 rounded-2xl shadow-xl max-w-md w-11/12 text-center" style="display: none;">
                <h2 class="text-3xl text-white font-bold mb-4">카메라 권한</h2>
                <p class="text-gray-200  mb-6">손동작 인식을 위해 카메라 권한이 필요합니다.<br>브라우저의 권한 허용 팝업을 확인해주세요.</p>
                <!-- Tailwind CSS 스피너 -->
                <div class="mt-6">
                    <svg class="animate-spin h-8 w-8 text-indigo-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
            </div>

            <!-- 
              4. 카메라 권한 거부 메시지 (카드 디자인)
                 (에러 상태를 text-red-500으로 표시합니다)
            -->
            <div class="permission-denied bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-11/12 text-center" style="display: none;">
                <h2 class="text-3xl font-bold mb-4 text-red-500">권한 거부됨</h2>
                <p class="text-gray-300">카메라 권한이 거부되었습니다.<br>손동작 인식을 사용하려면 브라우저 설정에서 권한을 허용한 후, 페이지를 새로고침 해주세요.</p>
            </div>
        </div>
    `;

    // 2. DOM 요소 참조
    const landingContainer = container.querySelector('.landing-container');
    const title = container.querySelector('.title-animation');
    const prompt = container.querySelector('.prompt');
    const btnYes = container.querySelector('#btn-tutorial-yes');
    const btnNo = container.querySelector('#btn-tutorial-no');
    const permMessage = container.querySelector('.permission-message');
    const permDenied = container.querySelector('.permission-denied');

    // 3. 이벤트 핸들러 정의
    const handleYes = () => {
        shouldCleanupTracking = false;
        router.navigate('/tutorial');
        console.log("튜토리얼 페이지로 이동 (미구현)");
    };

    const handleNo = () => {
        router.navigate('/simulation'); // Phase 3 (메인 시뮬레이션)으로 바로 이동
    };

    // 4. 페이지 진입 로직 실행
    const runPhase1 = async () => {

        // 1. H1 타이틀을 3D 파티클 애니메이션으로 대체하고 끝날 때까지 기다림
        try {
            // H1 타이틀을 숨기고, 그 자리에 캔버스를 생성하여 애니메이션 실행
            await runParticleAnimation(landingContainer, title);
        } catch (error) {
            console.error("타이틀 애니메이션 실패:", error);
            // 애니메이션 실패 시 H1 타이틀을 그냥 숨김 (다음 단계 진행을 위해)
            if (title) title.style.display = 'none';
        }

        // 2. (임시) 권한 요청 UI 표시
        if (permMessage) permMessage.style.display = 'block';

        // 3. TODO: 실제 카메라 권한 요청 로직
        try {
            // 1. VideoManager 초기화 (DOM에 <video> 생성)
            // container(현재 페이지)에 비디오를 꽉 채움
            VideoManager.init(document.body, window.innerWidth, window.innerHeight);

            // 2. 카메라 시작 (*** 실제 권한 요청 발생 ***)
            await VideoManager.startCamera();
            const videoElement = VideoManager.getElement();
            if (!videoElement) {
                throw new Error("VideoManager에서 video 요소를 가져오지 못했습니다.");
            }


            // GestureTracking.gestureRecognizer가 null일 때만 (즉, 초기화 안 됐을 때만) init을 호출
            if (!GestureTracking.gestureRecognizer) {
                console.log("LandingPage: GestureTracking.init()을 처음 호출합니다.");
                await GestureTracking.init(videoElement); // tracking.js 시작
            } else {
                console.log("LandingPage: GestureTracking이 이미 초기화되어 있으므로 init()을 건너뜁니다.");
                // 비디오 엘리먼트가 바뀌었을 수 있으니 비디오만 업데이트
                GestureTracking.start(videoElement);
                GestureTracking.video = videoElement;
            }VirtualMouse.init();


            // (임시) 2초 후 성공했다고 가정
            // await new Promise(resolve => setTimeout(resolve, 1000));
            // console.log("카메라 권한 획득 (가상)");

            if (permMessage) permMessage.style.display = 'none';

            console.log("video and tracking 초기화 완료");
            if (prompt) prompt.style.display = 'block';

            if (btnYes) btnYes.addEventListener('click', handleYes);
            if (btnNo) btnNo.addEventListener('click', handleNo);

            GestureTracking.start(); // 손동작 추적 시작

        } catch (error) {
            // 권한 요청 실패 시
            console.error("카메라 시작 또는 트래킹 초기화 실패:", err);
            if (permMessage) permMessage.style.display = 'none';
            if (permDenied) permDenied.style.display = 'block';
        }
    };

    runPhase1(); // 로직 실행

    // 5. 정리(cleanup) 함수 반환
    return () => {
        btnYes.removeEventListener('click', handleYes);
        btnNo.removeEventListener('click', handleNo);

        if (shouldCleanupTracking) {
            console.log("Cleaning up tracking modules from LandingPage...");
            GestureTracking.stop();
            VirtualMouse.destroy();
            VideoManager.destroy();
        } else {
            console.log("Persisting tracking modules for TutorialPage...");
        }

        // (참고) 3D 애니메이션 관련 리소스(렌더러, 씬 등)는
        // runParticleAnimation 함수 내부에서 스스로 정리됩니다.
        container.innerHTML = ''; // 페이지 나갈 때 DOM 정리
    };
}



/**
 * 3D 타이틀 파티클 애니메이션을 실행하는 함수
 * @param {HTMLElement} container - 캔버스를 추가할 부모 컨테이너
 * @param {HTMLElement} titleElement - 숨길 H1 타이틀 요소
 * @returns {Promise<void>} 애니메이션이 완료되면 resolve되는 Promise
 */
function runParticleAnimation(container, titleElement) {

    // true: 연기 텍스처 / false: 기본 파티클(점)
    const USE_SMOKE = true;

    return new Promise((resolve, reject) => {

        // H1 타이틀 숨기기
        titleElement.style.display = 'none';

        let animationFrameId; // requestAnimationFrame ID

        // 2. 기본 씬(Scene), 카메라(Camera), 렌더러(Renderer) 설정
        const scene = new THREE.Scene();

        // 컨테이너 크기에 맞춰 카메라/렌더러 설정
        const width = container.clientWidth;
        const height = container.clientHeight || window.innerHeight; // 컨테이너 높이가 0일 경우 대비

        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        camera.position.z = 10;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); // 배경 투명
        renderer.setSize(width, height);
        container.appendChild(renderer.domElement); // <body>가 아닌 지정된 컨테이너에 추가

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true; 
        controls.enableZoom = false; // 줌 비활성화
        controls.enablePan = false; // 패닝 비활성화

        // 자동 궤도(Orbital) 애니메이션 활성화
        controls.autoRotate = true;
        controls.autoRotateSpeed = 1.0; // 궤도 속도 (1.0

        // 수직 회전 각도 제한 (너무 위아래로 돌지 않도록)
        controls.minPolarAngle = Math.PI / 2.4; // (약 81도)
        controls.maxPolarAngle = Math.PI / 1.6; // (약 100도)

        // 3. 폰트 로드 및 텍스트 지오메트리 생성
        const fontLoader = new FontLoader();
        let particleSystem;
        let originalPositions;
        let particleVelocities;
        let textMesh;
        const clock = new THREE.Clock();
        // 폰트 경로 수정: Webpack으로 빌드할 경우, 폰트 파일은 정적 에셋으로 제공되어야 합니다.
        // 우선 'three/examples/fonts/' 경로를 사용, 에러 시 import 된 폰트 데이터 사용
        const fontPath = 'three/examples/fonts/helvetiker_regular.typeface.json';

        // 애니메이션 지속 시간 (반복 없음)
        const scaleDuration = 1.2;
        const disperseDuration = 0.8;
        const totalDuration = scaleDuration + disperseDuration;

        // 지오메트리 생성 및 애니메이션 시작 헬퍼 함수
        function createGeometryAndAnimate(font) {
            try {
                // 4. 텍스트 지오메트리 생성 (이전과 동일)
                const textGeometry = new TextGeometry('flowground', {
                    font: font,
                    size: 1.5,
                    height: 0.4,
                    curveSegments: 12,
                    bevelEnabled: true,
                    bevelThickness: 0.03,
                    bevelSize: 0.02,
                    bevelOffset: 0,
                    bevelSegments: 5
                });
                textGeometry.center();

                // --- [신규] MeshSurfaceSampler 사용 ---
                // 1. 샘플링을 위해 텍스트 지오메트리로 텍스트 메쉬를 만듭니다.
                const textMaterial = new THREE.MeshBasicMaterial({
                    color: 0xffffff,
                    transparent: true,
                    opacity: 1.0
                });
                textMesh = new THREE.Mesh(textGeometry, textMaterial);
                scene.add(textMesh); // Solid 메쉬를 씬에 추가

                // 2. 샘플러를 초기화합니다.
                const sampler = new MeshSurfaceSampler(textMesh).build();

                // 3. 텍스트 지오메트리는 이제 샘플러에 복사되었으므로 원본은 제거합니다.
                textGeometry.dispose();

                // 4. 파티클 개수를 정합니다. (꼭짓점 개수와 상관없이 원하는 만큼)
                //    숫자를 늘릴수록 텍스트가 빽빽해집니다.
                const particleCount = 20000;

                // 5. 새 파티클 개수에 맞게 배열을 초기화합니다.
                originalPositions = new Float32Array(particleCount * 3);
                particleVelocities = new Float32Array(particleCount * 3);
                const particleGeometry = new THREE.BufferGeometry();

                // 6. 샘플링에 사용할 임시 Vector3 객체
                const tempPosition = new THREE.Vector3();

                // 7. 파티클 개수만큼 루프를 돌며 메쉬 표면에서 점을 샘플링합니다.
                for (let i = 0; i < particleCount; i++) {
                    // 메쉬 표면에서 무작위 점 하나를 샘플링하여 tempPosition에 저장
                    sampler.sample(tempPosition);

                    // 샘플링된 위치를 originalPositions에 저장
                    originalPositions[i * 3] = tempPosition.x;
                    originalPositions[i * 3 + 1] = tempPosition.y;
                    originalPositions[i * 3 + 2] = tempPosition.z;

                    // 각 파티클의 분산 속도 (사방으로 퍼지도록)
                    const speedFactor = 0.05 + (Math.random() * 0.3); // 속도 랜덤화
                    particleVelocities[i * 3] = (Math.random() - 0.5) * speedFactor;
                    // Y축도 위아래 랜덤 + 약간의 상승력
                    particleVelocities[i * 3 + 1] = (Math.random() - 0.5) * speedFactor + 0.05;
                    particleVelocities[i * 3 + 2] = (Math.random() - 0.5) * speedFactor;
                }

                particleGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(originalPositions), 3));

                let particleMaterial;
                if (USE_SMOKE) {
                    particleMaterial = createSmokeMaterial();
                } else {
                    particleMaterial = createParticleMaterial();
                }
                // ---------------------------------------------

                particleSystem = new THREE.Points(particleGeometry, particleMaterial);
                particleSystem.visible = false;
                scene.add(particleSystem);

                // 6. 애니메이션 루프 시작 (반복 없음)
                animate();

            } catch (error) {
                // (최악의 경우) 폰트 파싱/지오메트리 생성 실패
                console.error("지오메트리 생성 실패 (Fallback 폰트 데이터 이상):", error);
                // 애니메이션 건너뛰고 종료
                animate();
            }
        }

        fontLoader.load(fontPath,
            // 3-2. (성공 시)
            (font) => {
                console.log("fontPath 로드 성공.");
                createGeometryAndAnimate(font);
            },
            // (진행 콜백 - 비워둠)
            undefined,
            // 3-3. (실패 시 - Fallback)
            (error) => {
                console.warn(`fontPath 로드 실패 ('${fontPath}'): ${error.message}`);
                console.log("Fallback: import된 기본 폰트로 파싱을 시도합니다.");

                try {
                    // import한 폰트 데이터(JSON)를 동기적으로 파싱합니다.
                    const font = fontLoader.parse(helvetikerFontData);
                    createGeometryAndAnimate(font);
                } catch (parseError) {
                    console.error("Fallback 폰트 파싱조차 실패했습니다:", parseError);
                    // (최악의 경우) 폰트가 아예 없으므로 애니메이션을 건너뜁니다.
                    animate();
                }
            }
        );

        // 7. 애니메이션 루프 (수정됨)
        function animate() {
            const elapsedTime = clock.getElapsedTime();

            if (elapsedTime > totalDuration) {
                // --- 3단계: 애니메이션 종료 및 정리 ---
                cancelAnimationFrame(animationFrameId); // 루프 중지

                // 리소스 정리 (메모리 누수 방지)
                if (particleSystem) { // particleSystem이 성공적으로 로드된 경우에만 정리
                    scene.remove(particleSystem);
                    particleSystem.geometry.dispose();
                    particleSystem.material.dispose();
                }
                if (textMesh) {
                    scene.remove(textMesh);
                    textMesh.geometry.dispose();
                    textMesh.material.dispose();
                }
                renderer.dispose();
                controls.dispose();

                // DOM에서 캔버스 제거
                if (container.contains(renderer.domElement)) {
                    container.removeChild(renderer.domElement);
                }

                // 창 크기 조절 리스너 제거
                window.removeEventListener('resize', onWindowResize);

                resolve(); // Promise 완료!
                return; // 함수 종료
            }

            // 애니메이션 진행
            // [수정] 애니메이션 진행 로직
            if (particleSystem && textMesh) {
                const particlePositions = particleSystem.geometry.attributes.position;
                const particleMaterial = particleSystem.material;
                const textMaterial = textMesh.material;
                const particleCount = particlePositions.count;

                if (elapsedTime <= scaleDuration) {
                    // --- 1단계: Solid 텍스트 확대 ---
                    const scale = 0.5 + (elapsedTime / scaleDuration) * 1.0;

                    textMesh.scale.set(scale, scale, scale);
                    textMesh.visible = true;

                    particleSystem.scale.set(scale, scale, scale);
                    particleSystem.visible = false;

                    // (파티클 리셋)
                    if (particleMaterial.opacity < 1.0) {
                        particleMaterial.opacity = 1.0;
                        particlePositions.array.set(originalPositions);
                        particlePositions.needsUpdate = true;
                    }

                } else {
                    // --- 2단계: 파티클 분산 및 페이드 아웃 ---
                    const disperseTime = elapsedTime - scaleDuration;

                    textMesh.visible = false; // Solid 텍스트 숨기기

                    particleSystem.visible = true; // 파티클 시스템 보이기
                    particleSystem.scale.set(2.0, 2.0, 2.0);

                    // 항력(Drag) 및 난류(Noise) 설정
                    const drag = 0.94; // 2%씩 속도 감소
                    const noiseStrength = 0.01; // 맴도는 효과의 강도
                    const noiseTime = elapsedTime * 0.5; // 노이즈가 변하는 속도

                    // 파티클 위치 업데이트 (흩어짐)
                    for (let i = 0; i < particleCount; i++) {
                        // 1. 항력 적용 (속도 감속)
                        particleVelocities[i * 3] *= drag;
                        particleVelocities[i * 3 + 1] *= drag;
                        particleVelocities[i * 3 + 2] *= drag;

                        // 2. 속도에 따라 위치 업데이트
                        particlePositions.array[i * 3] += particleVelocities[i * 3];
                        particlePositions.array[i * 3 + 1] += particleVelocities[i * 3 + 1];
                        particlePositions.array[i * 3 + 2] += particleVelocities[i * 3 + 2];

                        // 3. [추가] 난류(Noise) 적용 (맴도는 효과)
                        // 파티클의 원래 X위치와 시간을 기반으로 sin/cos 노이즈 생성
                        const noiseX = 1.2 * Math.sin(originalPositions[i * 3] * 0.7 + noiseTime) * noiseStrength;
                        const noiseY = 0.9 * Math.cos(originalPositions[i * 3] * 0.4 + noiseTime) * noiseStrength;

                        particlePositions.array[i * 3] += noiseX;
                        particlePositions.array[i * 3 + 1] += noiseY;
                    }
                    particlePositions.needsUpdate = true;

                    // 파티클 투명도 조절 (사라짐)
                    particleMaterial.opacity = 1.0 - (disperseTime / disperseDuration);

                    // 렌더링 모드에 따라 크기 조절
                    if (USE_SMOKE) {
                        const startSize = 0.5;
                        const growthFactor = 2.0;
                        particleMaterial.size = startSize + (disperseTime / disperseDuration) * growthFactor;
                    } else {
                        const startSize = 0.05;
                        const growthFactor = 0.1;
                        particleMaterial.size = startSize + (disperseTime / disperseDuration) * growthFactor;
                    }
                }
            }

            controls.update();
            renderer.render(scene, camera);

            animationFrameId = requestAnimationFrame(animate);
        }

        // 8. 창 크기 조절 대응
        function onWindowResize() {
            // 컨테이너 크기 다시 읽기
            const newWidth = container.clientWidth;
            const newHeight = container.clientHeight || window.innerHeight;

            camera.aspect = newWidth / newHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(newWidth, newHeight);
        }
        window.addEventListener('resize', onWindowResize);
    });
}

// --- 헬퍼 함수 (재질 생성) ---

/**
 * 기본 파티클(점) 재질을 생성합니다.
 */
function createParticleMaterial() {
    return new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.05,
        transparent: true,
        opacity: 1.0,
        blending: THREE.AdditiveBlending
    });
}

/**
 * 연기(텍스처) 재질을 생성합니다.
 */
function createSmokeMaterial() {
    const texture = createSmokeTexture();
    return new THREE.PointsMaterial({
        map: texture,
        size: 0.5,
        transparent: true,
        opacity: 1.0,
        blending: THREE.NormalBlending,
        depthWrite: false, // 텍스처끼리 겹칠 때 어색함을 방지
        color: 0xffffff
    });
}

/**
 * 2D Canvas를 사용해 실시간으로 연기 텍스처를 생성합니다.
 * (외부 이미지 파일 의존성 없음)
 */
function createSmokeTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext('2d');

    // 중앙은 50% 불투명한 흰색, 가장자리는 100% 투명한 그라데이션
    const gradient = context.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, canvas.width / 2
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    return new THREE.CanvasTexture(canvas);
}