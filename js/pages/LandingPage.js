import { router } from '../router.js';
// MediaPipe 카메라 권한 헬퍼가 있다면 가져옵니다.
// import { requestCameraPermission } from '../utils/mediaPipeHelper.js';

// Three.js 모듈 임포트 (Webpack/npm 경로로 수정)
import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import helvetikerFontData from 'three/examples/fonts/helvetiker_regular.typeface.json';
/**
 * Phase 1: 랜딩 페이지 컴포넌트
 */
export function LandingPage(container) {
    // 1. HTML 뼈대 렌더링
    container.innerHTML = `
        <div class="landing-container">
            <!-- 3D 애니메이션이 이 h1 요소를 대체할 것입니다. -->
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
    const landingContainer = container.querySelector('.landing-container');
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

        // 1. H1 타이틀을 3D 파티클 애니메이션으로 대체하고 끝날 때까지 기다림
        try {
            // H1 타이틀을 숨기고, 그 자리에 캔버스를 생성하여 애니메이션 실행
            await runParticleAnimation(landingContainer, title);
        } catch (error) {
            console.error("타이틀 애니메이션 실패:", error);
            // 애니메이션 실패 시 H1 타이틀을 그냥 숨김 (다음 단계 진행을 위해)
            title.style.display = 'none';
        }

        // 2. (임시) 권한 요청 UI 표시
        permMessage.style.display = 'block';

        // 3. TODO: 실제 카메라 권한 요청 로직
        try {
            // await requestCameraPermission(); // 실제 MediaPipe 권한 요청

            // (임시) 2초 후 성공했다고 가정
            await new Promise(resolve => setTimeout(resolve, 1000));

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

        // 3. 폰트 로드 및 텍스트 지오메트리 생성
        const fontLoader = new FontLoader();
        let particleSystem; 
        let originalPositions;
        let particleVelocities; 
        const clock = new THREE.Clock();
        // 폰트 경로 수정: Webpack으로 빌드할 경우, 폰트 파일은 정적 에셋으로 제공되어야 합니다.
        // 우선 'three/examples/fonts/' 경로를 사용, 에러 시 import 된 폰트 데이터 사용
        const fontPath = 'three/examples/fonts/helvetiker_regular.typeface.json';

        // 애니메이션 지속 시간 (반복 없음)
        const scaleDuration = 3.0;
        const disperseDuration = 4.0;
        const totalDuration = scaleDuration + disperseDuration;

        // 지오메트리 생성 및 애니메이션 시작 헬퍼 함수
        function createGeometryAndAnimate(font) {
            try {
                // 4. 텍스트 지오메트리...
                const textGeometry = new TextGeometry('flowground', {
                    font: font,
                    size: 3,
                    height: 0.2,
                    curveSegments: 12,
                    bevelEnabled: true,
                    bevelThickness: 0.03,
                    bevelSize: 0.02,
                    bevelOffset: 0,
                    bevelSegments: 5
                });
                textGeometry.center();

                // 5. 파티클 시스템 생성...
                const particleCount = textGeometry.attributes.position.count;
                originalPositions = new Float32Array(particleCount * 3);
                particleVelocities = new Float32Array(particleCount * 3);
                const particleGeometry = new THREE.BufferGeometry();

                for (let i = 0; i < particleCount; i++) {
                    const x = textGeometry.attributes.position.getX(i);
                    const y = textGeometry.attributes.position.getY(i);
                    const z = textGeometry.attributes.position.getZ(i);

                    originalPositions[i * 3] = x;
                    originalPositions[i * 3 + 1] = y;
                    originalPositions[i * 3 + 2] = z;

                    particleVelocities[i * 3] = (Math.random() - 0.5) * 0.1;
                    particleVelocities[i * 3 + 1] = (Math.random() * 0.2) + 0.05;
                    particleVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
                }

                particleGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(originalPositions), 3));

                const particleMaterial = new THREE.PointsMaterial({
                    color: 0xffffff,
                    size: 0.05,
                    transparent: true,
                    opacity: 1.0,
                    blending: THREE.AdditiveBlending
                });

                particleSystem = new THREE.Points(particleGeometry, particleMaterial);
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
            if (particleSystem) { // particleSystem이 있을 때만 애니메이션 실행
                const geometry = particleSystem.geometry;
                const material = particleSystem.material;
                const positions = geometry.attributes.position;
                const count = positions.count;

                if (elapsedTime <= scaleDuration) {
                    // --- 1단계: 확대 ---
                    const scale = 1.0 + (elapsedTime / scaleDuration) * 1.0;
                    particleSystem.scale.set(scale, scale, scale);
                    material.opacity = 1.0;

                } else {
                    // --- 2단계: 분산 및 페이드 아웃 ---
                    particleSystem.scale.set(2.0, 2.0, 2.0); // 스케일 고정
                    const disperseTime = elapsedTime - scaleDuration;

                    for (let i = 0; i < count; i++) {
                        positions.array[i * 3] += particleVelocities[i * 3];
                        positions.array[i * 3 + 1] += particleVelocities[i * 3 + 1];
                        positions.array[i * 3 + 2] += particleVelocities[i * 3 + 2];
                    }
                    positions.needsUpdate = true;
                    material.opacity = 1.0 - (disperseTime / disperseDuration);
                }
            }

            controls.update();
            renderer.render(scene, camera);

            // 다음 프레임 요청
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