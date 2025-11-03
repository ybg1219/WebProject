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
    <div class="tutorial-container flex items-center justify-center h-screen w-screen text-white font-sans overflow-hidden">

        <div id="tutorial-video-step" class="flex flex-col items-center justify-center w-full h-full">

            <div id="tutorial-video-placeholder" class="text-center">
                <h2 class="text-4xl font-bold text-indigo-400">튜토리얼 영상 재생 중...</h2>
                <p class="text-gray-400 mt-4">(임시 플레이스홀더 - 2초 후 사라짐)</p>
            </div>

            <div id="practice-prompt" class="prompt z-10 bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-11/12 text-center mt-8" style="display: none;">
                <h2 class="text-3xl font-bold mb-4">연습 페이지로 가시겠습니까?</h2>
                <p class="text-gray-300 mb-8">방금 배운 손동작(클릭, 드래그)을 연습합니다.</p>
                <div class="flex flex-col sm:flex-row gap-4 justify-center">
                    <button id="btn-practice-yes" class="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200">
                    예 (연습하기)
                    </button>
                    <button id="btn-practice-no" class="w-full sm:w-auto bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200">
                    아니오 (바로 시작)
                    </button>
                </div>
            </div>
        </div>

        <!-- --- 역할 2: 3D 연습 단계 --- -->
        <div id="tutorial-practice-step" class="relative w-full h-full" style="display: none;">
            <h1 class="absolute top-10 left-1/2 -translate-x-1/2 z-10 text-4xl font-bold text-green-400">3D 연습 환경</h1>
            <p class="absolute top-20 left-1/2 -translate-x-1/2 z-10 text-gray-400">(손동작으로 큐브를 클릭/드래그 해보세요)</p>
            
            <div id="asset-bar-container" 
                class="absolute top-60 left-1/2 -translate-x-1/2 z-10 w-11/12 max-w-md">
                <!-- AssetBar.js가 여기에 렌더링됩니다 -->
            </div>

            <button id="btn-practice-done" class="absolute top-40 left-1/2 -translate-x-1/2 z-10 z-10 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200">
            연습 완료 (메인으로 이동)
            </button>
        </div>
    </div>
    `;

    // --- DOM 요소 참조 ---
    const videoStep = container.querySelector('#tutorial-video-step');
    const videoPlaceholder = container.querySelector('#tutorial-video-placeholder');
    const practicePrompt = container.querySelector('#practice-prompt');
    const btnPracticeYes = container.querySelector('#btn-practice-yes');
    const btnPracticeNo = container.querySelector('#btn-practice-no');

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


    // --- 단계 전환 함수 (역할 분리) ---
    function showVideoStep() {
        if (videoStep) videoStep.style.display = 'flex';
        if (practiceStep) practiceStep.style.display = 'none';

        // 2초 후 영상 숨기고 프롬프트 표시
        setTimeout(() => {
            if (videoPlaceholder) videoPlaceholder.style.display = 'none';
            if (practicePrompt) practicePrompt.style.display = 'block';
        }, 2000);
    }

    function showPracticeStep() {
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
    btnPracticeYes.addEventListener('click', handlePracticeYes);
    btnPracticeNo.addEventListener('click', handlePracticeNo);
    btnPracticeDone.addEventListener('click', handlePracticeDone);

    // --- 초기 실행 ---
    showVideoStep(); // 첫 단계(비디오)로 시작

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
            new AssetSlot('cone', `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.2 7.8l-7.7 7.7-4-4L2 18"></path><path d="M16 16h4v4"></path></svg>`) // (임시 아이콘, Cone 아이콘이 없어 TrendUp 사용)
        ];

        // 2. HTML 렌더링
        this.container.innerHTML = `
            <div class="bg-gray-800 bg-opacity-80 backdrop-blur-sm p-3 rounded-full">
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
