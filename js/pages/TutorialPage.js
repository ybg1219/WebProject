import { router } from '../router.js';
// [추가] 모듈 import (cleanup을 위해)
import VideoManager from '../modules/VideoManager.js';
import GestureTracking from '../modules/GestureTracking.js';
import VirtualMouse from '../modules/VirtualMouse.js';

// [추가] 3D 연습 씬을 위한 Three.js 임포트
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
// (OrbitControls, BoxGeometry 등 필요한 다른 모듈도 여기에 추가)

/**
 * Phase 2: 튜토리얼 학습 및 3D 연습 페이지 (통합)
 */
export function TutorialPage(container) {
    // 페이지 이탈 시 트래킹 모듈을 정리할지 여부 (기본값: true)
    let shouldCleanupTracking = true;

    // [추가] 3D 연습 씬을 위한 변수
    let renderer, scene, camera, controls, raycaster, mouse, plane;
    let grabbedObject = null;
    let spawnedObjects = [];
    let animationId = null;
    let assetBar = null;

    // --- HTML 뼈대 (두 단계를 모두 포함) ---
    container.innerHTML = `
    <div class="tutorial-container flex items-center justify-center h-screen w-screen text-white bg-gradient-to-r from-blue-400 to-blue-600  font-sans overflow-hidden">

        <div id="tutorial-video-step" class="flex flex-col items-center justify-center w-full h-full">

            <div id="video-container" class="relative w-full h-auto aspect-video rounded-lg shadow-xl overflow-hidden">
                <!-- 점선 네모 (z-10) -->
                <div class="absolute inset-20 border-4 border-dashed border-white animation-purse opacity-75 rounded-lg pointer-events-none z-10"></div>
                <!-- 로딩 텍스트 (z-0) -->
                <div id="video-loading-text" class="absolute inset-0 flex flex-col items-center justify-center z-0">
                    <h2 class="text-3xl font-bold text-blue-800">웹캠을 가져오는 중...</h2>
                    <p class="text-gray-200 mt-4"> 튜토리얼을 위해 영상을 가져오는 중입니다. 잠시만 기다려주세요.</p>
                </div>
            </div>
            

            <div id="practice-prompt" class="prompt z-20 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/30 backdrop-blur-xl border border-white/10 p-8 sm:p-10 rounded-3xl shadow-2xl max-w-2xl w-11/12 text-center" style="display: none;">
                
                <h2 class="text-xl sm:text-2xl font-semibold mb-6 text-indigo-100 leading-snug">
                    이제 웹캠을 통해 제스처로 다양한 작업을 할 수 있습니다!
                </h2>
                
                <div class="text-gray-200 mb-8 text-sm sm:text-base space-y-4 text-left bg-black/20 p-6 rounded-2xl border border-white/5 shadow-inner">
                    
                    <p class="text-lg sm:text-xl font-md text-white mb-4 text-center">
                        연기의 흐름을 체험해보시겠습니까?
                    </p>
                    
                    <div class="space-y-2 pl-4">
                        <p class="flex items-start gap-2">
                            <span>🔹</span>
                            <span>
                                <span class="font-bold text-white">"예"</span> : 전신 추적을 통해 <span class="text-indigo-500 font-semibold">연기의 흐름(Flow)</span>을 만들어냅니다.
                            </span>
                        </p>
                        <p class="flex items-start gap-2">
                            <span>🔹</span>
                            <span>
                                <span class="font-bold text-white">"아니요"</span> : 제스처 인식으로 물체를 옮기는 <span class="text-indigo-500 font-semibold">가상 공간(Playground)</span>을 체험합니다.
                            </span>
                        </p>
                    </div>
                </div>

                <!-- 
                   버튼 그룹 (박스 밖으로 이동)
                   - py-4: 버튼 높이 적절하게 축소
                -->
                <div class="flex flex-col sm:flex-row gap-4 justify-center">
                    <button id="btn-practice-yes" class="w-full sm:w-auto bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 shadow-lg transform hover:scale-105 hover:shadow-indigo-500/25">
                        예 (연기 flow 체험)
                    </button>
                    <button id="btn-practice-no" class="w-full sm:w-auto bg-white/5 hover:bg-white/70 text-white font-semibold py-4 px-8 rounded-xl transition-colors duration-200 border border-white/10 hover:border-white/30 backdrop-blur-sm">
                        아니오 (Playground)
                    </button>
                </div>
            </div>
        </div>

        <div id="tutorial-text-overlay" 
                 class="absolute bottom-30 left-1/2 -translate-x-1/2 z-10 
                        w-11/12 max-w-3xl text-center p-4">

                
                <div class="w-full flex justify-center">
                <img id="tutorial-image-content" 
                src="" alt="튜토리얼 가이드"
                class="h-32 sm:h-40 object-contain 
                    transition-opacity duration-500 ease-in-out opacity-0
                    [filter:drop-shadow(0_4px_6px_rgba(0,0,0,0.4))]">
                </div>

                <p id="tutorial-text-content" 
                   class="w-full text-2xl font-semibold text-white text-center
                          [text-shadow:_0_2px_4px_rgb(0_0_0_/_70%)] 
                          transition-opacity duration-500 ease-in-out opacity-0">
                    <!-- 텍스트가 여기에 JS로 삽입됩니다. -->
                </p>
            </div>

        <!-- --- 역할 2: 3D 연습 단계 --- -->
        <div id="tutorial-practice-step" class="relative w-full h-full" style="display: none;">
            <p class="absolute top-80 left-1/2 -translate-x-1/2 z-10 text-gray-200 [text-shadow:_0_1px_2px_rgb(0_0_0_/_50%)]">(손으로 위의 바에서 물체를 잡아보세요. 잡고 물체를 이동한 후 바닥에 놓으면 됩니다.)</p>
            
            <!-- Phase 2: HTML 에셋 바 컨테이너 -->
            <div id="asset-bar-container" 
                class="absolute top-48 left-1/2 -translate-x-1/2 z-10 inline-flex justify-center py-4 px-8 gap-6">
                <!-- AssetBar.js가 여기에 렌더링됩니다 (AssetBar.js의 스타일이 적용됨) -->
            </div>

            <!-- 버튼 스타일 (LandingPage와 통일) -->
            <button id="btn-practice-done" class="absolute top-32 left-1/2 -translate-x-1/2 z-10 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200">연습 완료 (메인으로 이동)</button>
        </div>
    </div>
    `;

    // --- DOM 요소 참조 ---
    const videoStep = container.querySelector('#tutorial-video-step');
    const videoLoadingText = container.querySelector('#video-loading-text');
    const practicePrompt = container.querySelector('#practice-prompt');
    const btnPracticeYes = container.querySelector('#btn-practice-yes');
    const btnPracticeNo = container.querySelector('#btn-practice-no');
    // [신규] 튜토리얼 텍스트 참조
    const tutorialTextContent = container.querySelector('#tutorial-text-content');
    const tutorialImageContent = container.querySelector('#tutorial-image-content');


    const practiceStep = container.querySelector('#tutorial-practice-step');
    const btnPracticeDone = container.querySelector('#btn-practice-done');

    // --- 3D 연습 씬 관련 함수 (역할 2) ---
    function initPracticeScene() {
        console.log("3D 연습 씬 초기화 시작...");

        // 1. 기본 씬 설정
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 5, 10); // 카메라 위치 조정

        renderer = new THREE.WebGLRenderer({ alpha: true }); // 배경 투명
        renderer.setSize(window.innerWidth, window.innerHeight);

        // [수정] 캔버스 z-index를 -1로 하여 UI(버튼 등) 뒤에 렌더링
        renderer.domElement.style.position = 'absolute';
        renderer.domElement.style.top = '0';
        renderer.domElement.style.left = '0';
        renderer.domElement.style.zIndex = '0';

        // 3D 캔버스를 practiceStep의 *부모* (tutorial-container)에 추가
        practiceStep.appendChild(renderer.domElement);

        // 2. 컨트롤 (디버깅용 - 실제 마우스로 조작)
        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;

        // 3. 조명
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 10, 7.5);
        scene.add(directionalLight);

        // 4. 바닥 (Grid)
        const gridHelper = new THREE.GridHelper(20, 20);
        scene.add(gridHelper);

        // 5. 레이캐스팅 설정
        raycaster = new THREE.Raycaster();
        mouse = new THREE.Vector2(); // 3D 좌표(-1 to +1)로 변환될 2D 마우스 좌표

        // 6. 드래그를 위한 가상의 평면 (y=0 바닥)
        plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

        // 7. [★핵심★] VirtualMouse가 쏘는 이벤트를 캔버스가 받도록 리스너 연결
        renderer.domElement.addEventListener('mousemove', onSceneMouseMove, false);
        renderer.domElement.addEventListener('mousedown', onSceneMouseDown, false);
        renderer.domElement.addEventListener('mouseup', onSceneMouseUp, false);

        assetBar = new AssetBar('#asset-bar-container', onAssetGrab);
        assetBar.init();
        // (Phase 3-5) TODO: onMouseDown/Move/Up 함수 내용 구현

        // 8. 애니메이션 루프 시작
        function animate() {
            animationId = requestAnimationFrame(animate);
            controls.update(); // 디버깅용 카메라 컨트롤
            renderer.render(scene, camera);
        }
        animate();
    }

    /**
     * [신규] 3D 씬 리소스 및 이벤트 리스너를 정리합니다.
     */
    function cleanupPracticeScene() {
        console.log("3D 연습 씬 정리...");
        cancelAnimationFrame(animationId);

        // [★핵심★] 이벤트 리스너 제거
        if (renderer) {
            renderer.domElement.removeEventListener('mousemove', onSceneMouseMove);
            renderer.domElement.removeEventListener('mousedown', onSceneMouseDown);
            renderer.domElement.removeEventListener('mouseup', onSceneMouseUp);
        }

        if (controls) controls.dispose();

        // 3D 리소스 정리
        if (renderer) renderer.dispose();

        if (assetBar) {
            assetBar.destroy();
            assetBar = null;
        }

        if (scene) {
            scene.traverse(object => {
                if (object.geometry) object.geometry.dispose();
                if (object.material) object.material.dispose();
            });
        }
        if (renderer) renderer.domElement.remove();
    }

    /**
     * 에셋 바의 슬롯에서 mousedown이 발생했을 때 호출될 콜백
     * (다음 단계에서 구현)
     * @param {string} assetType - 'box', 'sphere', 'cone'
     */
    function onAssetGrab(assetType) {
        console.log(`Asset bar에서 ${assetType} 잡기 시작`);

        let geometry, material, mesh;
        material = new THREE.MeshNormalMaterial({ wireframe: true });

        // 1. assetType에 따라 새 3D 객체 생성
        switch (assetType) {
            case 'box':
                geometry = new THREE.BoxGeometry(1, 1, 1);
                break;
            case 'sphere':
                geometry = new THREE.SphereGeometry(0.5, 32, 16);
                break;
            case 'cone':
                geometry = new THREE.ConeGeometry(0.5, 1, 32);
                break;
            default:
                return;
        }
        mesh = new THREE.Mesh(geometry, material);

        // 2. grabbedObject로 설정하고 씬에 추가
        grabbedObject = mesh;
        scene.add(grabbedObject);
        spawnedObjects.push(grabbedObject); // 잡을 수 있는 객체 목록에 추가

        // 3. (중요) 객체를 즉시 마우스 위치로 이동
        // Raycaster를 현재 마우스 위치(mouse)로 업데이트
        raycaster.setFromCamera(mouse, camera);
        // 바닥(plane)과 교차하는 지점을 찾음
        const intersectPoint = new THREE.Vector3();
        raycaster.ray.intersectPlane(plane, intersectPoint);

        if (intersectPoint) {
            grabbedObject.position.copy(intersectPoint);
        }
    }

    /**
      * (가상) 마우스 이동 시 호출됩니다. (호버링 및 드래그)
      */
    function onSceneMouseMove(event) {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // [★수정★] (Phase 4) 드래그 로직 구현
        if (grabbedObject) {
            // 1. 레이캐스터 업데이트
            raycaster.setFromCamera(mouse, camera);

            // 2. 보이지 않는 바닥(plane)과 교차하는 3D 좌표 찾기
            const intersectPoint = new THREE.Vector3();
            raycaster.ray.intersectPlane(plane, intersectPoint);

            // 3. 교차점이 있다면, 잡고 있는 물체의 위치를 업데이트
            if (intersectPoint) {
                grabbedObject.position.copy(intersectPoint);
            }
        }
    }

    /**
     * (가상) 마우스 다운 시 호출됩니다. (잡기)
     */
    function onSceneMouseDown(event) {
        // [★수정★] (Phase 3) 씬에 있는 물체 다시 잡기

        // 1. 이미 다른 물체를 잡고 있거나, 에셋 바를 클릭했다면 무시
        if (grabbedObject || assetBar.container.contains(event.target)) {
            return;
        }

        console.log("3D Scene Mousedown (Hand Grab)");

        // 2. 레이캐스터 업데이트
        raycaster.setFromCamera(mouse, camera);

        // 3. 씬에 있는 잡을 수 있는 물체들(grabbableObjects)과 교차하는지 확인
        const intersects = raycaster.intersectObjects(spawnedObjects);

        if (intersects.length > 0) {
            // 4. 가장 가까운 물체를 잡음
            grabbedObject = intersects[0].object;
            console.log("씬에 있던 물체 잡기:", grabbedObject);
        }
    }

    /**
     * (가상) 마우스 업 시 호출됩니다. (놓기)
     */
    function onSceneMouseUp(event) {
        // (Phase 5) 놓기 로직
        if (grabbedObject) {
            console.log("3D Scene Mouseup (Hand Release)");
            // 씬에 놓기 (grabbableObjects 목록에는 이미 있음)
            grabbedObject = null; // 잡고 있던 객체 참조 해제
        }
    }


    let video = VideoManager.getElement();
    // --- 초기 실행 ---
    async function initializePage() {

        if (!video) {
            // Case 1: 새로고침 또는 직접 접근 (트래킹 모듈 초기화 필요)
            console.log("VideoManager가 실행 중이 아님. TutorialPage에서 직접 초기화합니다.");
            try {
                // LandingPage와 동일하게 초기화 수행
                VideoManager.init(document.body, window.innerWidth, window.innerHeight);
                await VideoManager.startCamera();
                video = VideoManager.getElement(); // 새로 생성된 비디오 가져오기

                if (!video) throw new Error("VideoManager가 비디오 요소를 생성하지 못했습니다.");

                await GestureTracking.init(video);
                VirtualMouse.init();
                GestureTracking.start();

                console.log("TutorialPage에서 트래킹 모듈 초기화 완료.");

            } catch (err) {
                console.error("TutorialPage 카메라/트래킹 초기화 실패:", err);
                if (videoLoadingText) {
                    videoLoadingText.querySelector('h2').innerText = '웹캠 로드 실패';
                    videoLoadingText.querySelector('p').innerText = '카메라 권한을 확인하고 새로고침하세요.';
                }
                // 비디오 로딩 실패 시, 2초 후 프롬프트만 표시
                setTimeout(() => {
                    if (practicePrompt) practicePrompt.style.display = 'block';
                }, 2000);
                return; // 함수 중단
            }
        } else {
            // Case 2: LandingPage에서 정상적으로 넘어옴
            console.log("VideoManager가 이미 실행 중입니다.");
        }

        if (video) {
            video.style.opacity = '1';
            video.classList.add('opacity-100');
            video.classList.remove('opacity-0');
            console.log("웹캠 비디오 Opacity를 1로 설정.");
        } else {
            // (이론상 catch 블록에서 걸러져야 하지만, 안전 장치)
            console.error("InitializePage: videoElement가 여전히 null입니다.");
            if (videoLoadingText) videoLoadingText.querySelector('h2').innerText = '웹캠 로드 실패';
            return;
        }

        // Case 1, 2 모두 비디오가 준비되었으므로 비디오 단계를 표시
        showVideoStep(video);
    }
    initializePage();


    // --- 단계 전환 함수 (역할 분리) ---
    function showVideoStep() {
        if (videoStep) videoStep.style.display = 'flex';
        if (practiceStep) practiceStep.style.display = 'none';

        // 비디오가 배경에서 보이므로, 로딩 텍스트를 즉시 숨깁니다.
        if (videoLoadingText) videoLoadingText.style.display = 'none';

        if (tutorialTextContent && tutorialImageContent) {

            // 이미지 경로 정의 (Webpack이 process.env.PUBLIC_URL을 치환)
            const img0 = `${process.env.PUBLIC_URL}image/tutorial0.png`;
            const img1 = `${process.env.PUBLIC_URL}image/tutorial1.png`;
            const img2 = `${process.env.PUBLIC_URL}image/tutorial2.png`;
            const img3 = `${process.env.PUBLIC_URL}image/tutorial3.png`;

            // 1. (즉시) 텍스트 1, 이미지 1 표시
            tutorialTextContent.innerText = "          안녕하세요! 손을 화면에 흔들어보세요           ";
            tutorialImageContent.src = img0;
            tutorialTextContent.style.opacity = '1';
            tutorialImageContent.style.opacity = '1';

            // 2. (3초 후) 텍스트 2, 이미지 2로 변경
            setTimeout(() => {
                if (tutorialTextContent && tutorialImageContent) {
                    tutorialTextContent.innerText = "최대한 손과 머리를 점선 안에서 움직여주세요.";
                    tutorialImageContent.src = img1;
                }
            }, 4000); // 3초


            // 2. (3초 후) 텍스트 2, 이미지 2로 변경
            setTimeout(() => {
                if (tutorialTextContent && tutorialImageContent) {
                    tutorialTextContent.innerText = "사용자의 모션을 인식하여";
                    tutorialImageContent.src = img2;
                }
            }, 8000); // 3초

            // 3. (6초 후) 텍스트 3, 이미지 3로 변경
            setTimeout(() => {
                if (tutorialTextContent && tutorialImageContent) {
                    tutorialTextContent.innerText = "연기를 생성하고 흐름을 만들어냅니다.";
                    tutorialImageContent.src = img3;
                }
            }, 11000); // 3 + 3 = 6초

            // 4. (9초 후) 텍스트와 이미지 숨기기
            setTimeout(() => {
                if (tutorialTextContent && tutorialImageContent) {
                    tutorialTextContent.style.opacity = '0';
                    tutorialImageContent.style.opacity = '0';
                }
            }, 15000); // 6 + 3 = 9초
        }

        // 5초 후 프롬프트 표시 (점선 네모는 이미 보이고 있음)
        setTimeout(() => {
            if (practicePrompt) practicePrompt.style.display = 'block';
        }, 13000);
    }

    function showPracticeStep() {
        video.style.opacity = '0';
        if (videoStep) videoStep.style.display = 'none';
        if (practiceStep) practiceStep.style.display = 'block';
        initPracticeScene(); // 3D 씬 시작
    }

    // --- 이벤트 핸들러 ---
    const handlePracticeYes = () => {
        // [수정] 네비게이션 대신 내부 씬 전환
        console.log("연습 단계로 전환");
        showPracticeStep();
    };

    const handlePracticeNo = () => {
        shouldCleanupTracking = true; // 트래킹 모듈 파괴
        router.navigate('/simulation');
    };

    const handlePracticeDone = () => {
        shouldCleanupTracking = true; // 트래킹 모듈 파괴
        router.navigate('/simulation');
    };

    // --- 리스너 연결 ---
    btnPracticeYes.addEventListener('click', handlePracticeNo);
    btnPracticeNo.addEventListener('click', handlePracticeYes);
    btnPracticeDone.addEventListener('click', handlePracticeDone);



    // --- 정리(cleanup) 함수 ---
    return () => {
        btnPracticeYes.removeEventListener('click', handlePracticeYes);
        btnPracticeNo.removeEventListener('click', handlePracticeNo);
        btnPracticeDone.removeEventListener('click', handlePracticeDone);

        cleanupPracticeScene(); // 3D 씬 정리

        // 플래그에 따라 트래킹 모듈을 선택적으로 파괴
        if (shouldCleanupTracking) {
            console.log("Cleaning up tracking modules from TutorialPage...");
            GestureTracking.stop();
            VirtualMouse.destroy();
            VideoManager.destroy();
        } else {
            // (이 케이스는 이제 발생하지 않음)
            console.log("Persisting tracking modules (should not happen from here)...");
        }

        container.innerHTML = '';
    };
}

/**
 * 개별 에셋 슬롯을 나타내는 클래스
 */
class AssetSlot {
    constructor(assetType, iconHTML) {
        this.assetType = assetType; // 'box', 'sphere', 'cone' 등
        this.iconHTML = iconHTML;     // 슬롯에 표시될 SVG 또는 텍스트
        this.element = null;          // 이 슬롯에 해당하는 DOM 요소
    }

    /**
     * 이 슬롯의 HTML 문자열을 반환합니다.
     */
    render() {
        return `
            <button 
                type="button"
                data-asset-type="${this.assetType}"
                class="asset-slot w-16 h-16 bg-gray-700 rounded-xl flex items-center justify-center 
                       flex-shrink-0 text-white text-sm hover:bg-indigo-600 transition-colors"
                title="Drag ${this.assetType}"
            >
            <span style="pointer-events: none;">
                ${this.iconHTML}
            </button>
        `;
    }
}

/**
 * 에셋 바 전체를 관리하는 메인 클래스
 */
class AssetBar {
    /**
     * @param {string} containerSelector - 에셋 바가 렌더링될 div의 CSS 선택자
     * @param {function(string)} onSlotGrab - 슬롯에서 mousedown 이벤트 발생 시 호출될 콜백
     */
    constructor(containerSelector, onSlotGrab) {
        this.container = document.querySelector(containerSelector);
        if (!this.container) {
            console.error(`AssetBar: 컨테이너(${containerSelector})를 찾을 수 없습니다.`);
            return;
        }

        this.onSlotGrab = onSlotGrab; // 'mousedown' 시 실행할 콜백
        this.assetSlots = [];         // AssetSlot 인스턴스 배열

        // mousedown 이벤트를 클래스 내부에서 처리하기 위해 바인딩
        this.handleMouseDown = this.handleMouseDown.bind(this);
    }

    /**
     * 에셋 바를 초기화하고, 슬롯을 생성하며, 렌더링합니다.
     */
    init() {
        if (!this.container) return;

        // 1. 에셋 슬롯 생성 (요청하신 Box, Sphere, Cone)
        this.assetSlots = [
            // SVG 아이콘을 사용한 예시 (Tailwind 아이콘)
            new AssetSlot('box', `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>`),
            new AssetSlot('sphere', `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle></svg>`),
            new AssetSlot('cone', `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 L4 21 Q12 23 20 21 Z"></path></svg>`)];

        // 2. HTML 렌더링
        this.container.innerHTML = `
            <div class="bg-gray-800 bg-opacity-60 backdrop-blur-sm px-6 p-3 rounded-full">
                <div class="flex space-x-3 overflow-x-auto">
                    ${this.assetSlots.map(slot => slot.render()).join('')}
                </div>
            </div>
        `;

        // 3. 이벤트 리스너 추가
        this.addListeners();
    }

    /**
     * 각 슬롯 버튼에 mousedown 리스너를 추가합니다.
     */
    addListeners() {
        this.container.querySelectorAll('.asset-slot').forEach(element => {
            // AssetSlot 클래스 인스턴스에 DOM 요소를 연결
            const type = element.dataset.assetType;
            const slot = this.assetSlots.find(s => s.assetType === type);
            if (slot) slot.element = element;

            // 'mousedown'은 가상 마우스와 실제 마우스 모두에서 작동
            element.addEventListener('mousedown', this.handleMouseDown);
        });
    }

    /**
     * 슬롯에서 mousedown 이벤트가 발생했을 때 처리합니다.
     */
    handleMouseDown(event) {
        // 기본 드래그 동작 방지
        event.preventDefault();

        const assetType = event.currentTarget.dataset.assetType;
        if (assetType && this.onSlotGrab) {
            // (다음 단계) 콜백 함수를 호출하여 TutorialPage에 '잡기' 시작을 알림
            this.onSlotGrab(assetType);
        }
    }

    /**
     * 에셋 바를 파괴하고 이벤트 리스너를 정리합니다.
     */
    destroy() {
        this.container.querySelectorAll('.asset-slot').forEach(element => {
            element.removeEventListener('mousedown', this.handleMouseDown);
        });
        this.container.innerHTML = '';
        this.assetSlots = [];
    }
}
