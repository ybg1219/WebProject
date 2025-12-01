import { router } from '../router.js';
import VideoManager from '../modules/VideoManager.js';
import GestureTracking from '../modules/GestureTracking.js';
import VirtualMouse from '../modules/VirtualMouse.js';
// import { AssetBar } from '../modules/AssetBar.js';

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'; // [★신규★] HDRI 로더

/**
 * Phase 2: 3D 연습 페이지 (소품샵)
 */
export function PracticePage(container) {

    // 3D 씬 변수
    let camera, scene, renderer, controls, animationId;
    let raycaster, mouse, plane;
    let grabbedObject = null;
    let sceneObjects = [];
    let assetBar = null;

    /**
     * 3D 씬 초기화 및 GLTF/HDRI 로드
     */
    async function initScene() {
        // 1. 씬 생성
        scene = new THREE.Scene();
        // 배경색은 HDRI가 로드되면 대체됩니다.

        // 2. 카메라
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 2, 6);

        // 3. 렌더러 설정 (HDRI 설정을 위해 톤매핑 적용)
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // [★수정★] HDRI 색상 표현을 위한 톤매핑 설정
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 0.8;
        // renderer.outputEncoding = THREE.sRGBEncoding; // 최신 Three.js에서는 기본값이므로 생략 가능

        renderer.domElement.style.position = 'absolute';
        renderer.domElement.style.top = '0';
        renderer.domElement.style.left = '0';
        renderer.domElement.style.zIndex = '0';
        container.appendChild(renderer.domElement);

        // [★수정★] 기존 조명(Ambient, Directional) 및 그림자 코드 제거됨

        // 4. [★신규★] HDRI 로드 및 환경맵 설정
        const rgbeLoader = new RGBELoader();
        // public/asset 폴더에 'environment.hdr' 파일이 있어야 합니다.
        // const hdriPath = 'asset/cobblestone_street_night_2k.hdr';
        const hdriPath = 'asset/san_giuseppe_bridge_2k.hdr';

        try {
            const texture = await rgbeLoader.loadAsync(hdriPath);
            texture.mapping = THREE.EquirectangularReflectionMapping;

            scene.background = texture; // 큐브맵 배경으로 사용
            scene.environment = texture; // 조명(IBL)으로 사용
            console.log("HDRI 로드 성공");
        } catch (error) {
            console.error(`HDRI 로드 실패: ${hdriPath}. (public/asset 폴더에 .hdr 파일이 있는지 확인하세요)`, error);
            // 실패 시 기본 조명 추가 (Fallback)
            const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
            scene.add(ambientLight);
        }

        // 5. 바닥 (참조용 그리드만 유지)
        const gridHelper = new THREE.GridHelper(20, 20, 0x888888, 0x444444);
        scene.add(gridHelper);

        // 6. 인터랙션 필수 요소 초기화
        raycaster = new THREE.Raycaster();
        mouse = new THREE.Vector2();
        plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

        // 7. 컨트롤
        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;

        // 8. 이벤트 리스너
        renderer.domElement.addEventListener('mousemove', onSceneMouseMove, false);
        renderer.domElement.addEventListener('mousedown', onSceneMouseDown, false);
        renderer.domElement.addEventListener('mouseup', onSceneMouseUp, false);

        // 9. 에셋 바 초기화
        assetBar = new AssetBar('#asset-bar-container', onAssetGrab);
        assetBar.init();

        // 10. GLTF 로드
        const loader = new GLTFLoader();
        const gltfPath = 'asset/shop.gltf';

        try {
            const gltf = await loader.loadAsync(gltfPath);
            console.log("GLTF 로드 성공");
            scene.add(gltf.scene);
        } catch (error) {
            console.error(`GLTF 로드 실패: ${gltfPath}`, error);
        }

        // 11. 애니메이션 루프
        function animate() {
            animationId = requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        }
        animate();
    }

    /**
     * 3D 씬 리소스 정리
     */
    function cleanupScene() {
        console.log("Cleaning up PracticeScene...");
        if (animationId) cancelAnimationFrame(animationId);

        if (renderer) {
            renderer.domElement.removeEventListener('mousemove', onSceneMouseMove);
            renderer.domElement.removeEventListener('mousedown', onSceneMouseDown);
            renderer.domElement.removeEventListener('mouseup', onSceneMouseUp);
        }

        if (assetBar) {
            assetBar.destroy();
            assetBar = null;
        }

        if (controls) controls.dispose();
        if (renderer) renderer.dispose();
        if (scene) {
            scene.traverse(object => {
                if (object.geometry) object.geometry.dispose();
                if (object.material) {
                    if (Array.isArray(object.material)) object.material.forEach(m => m.dispose());
                    else object.material.dispose();
                }
            });
            // 환경맵 텍스처 정리
            if (scene.background) scene.background.dispose();
            if (scene.environment) scene.environment.dispose();
        }
        if (renderer) renderer.domElement.remove();
    }

    // --- 3D 이벤트 핸들러 ---

    function onAssetGrab(assetType) {
        console.log(`Asset bar에서 ${assetType} 잡기 시작`);

        let geometry, material, mesh;
        // HDRI 환경맵 반사를 잘 보여주기 위해 Metalness/Roughness 재질 사용
        material = new THREE.MeshStandardMaterial({
            color: 0x00ff00,
            roughness: 0.1,
            metalness: 0.8
        });

        switch (assetType) {
            case 'box':
                geometry = new THREE.BoxGeometry(1, 1, 1);
                geometry.translate(0, 0.5, 0);
                break;
            case 'sphere':
                geometry = new THREE.SphereGeometry(0.5, 32, 16);
                geometry.translate(0, 0.5, 0);
                break;
            case 'cone':
                geometry = new THREE.ConeGeometry(0.5, 1, 32);
                geometry.translate(0, 0.5, 0);
                break;
            default:
                return;
        }
        mesh = new THREE.Mesh(geometry, material);

        // [수정] 그림자 설정 제거 (HDRI 사용)

        grabbedObject = mesh;
        scene.add(grabbedObject);
        sceneObjects.push(grabbedObject);

        raycaster.setFromCamera(mouse, camera);
        const intersectPoint = new THREE.Vector3();
        plane.set(new THREE.Vector3(0, 1, 0), -0.5);
        raycaster.ray.intersectPlane(plane, intersectPoint);

        if (intersectPoint) {
            grabbedObject.position.copy(intersectPoint);
        }
    }

    function onSceneMouseMove(event) {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        if (grabbedObject) {
            plane.set(new THREE.Vector3(0, 1, 0), -grabbedObject.position.y);
            raycaster.setFromCamera(mouse, camera);
            const intersectPoint = new THREE.Vector3();
            raycaster.ray.intersectPlane(plane, intersectPoint);

            if (intersectPoint) {
                grabbedObject.position.copy(intersectPoint);
            }
        }
    }

    function onSceneMouseDown(event) {
        if (grabbedObject || assetBar.container.contains(event.target)) {
            return;
        }

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(sceneObjects);

        if (intersects.length > 0) {
            grabbedObject = intersects[0].object;
            plane.set(new THREE.Vector3(0, 1, 0), -grabbedObject.position.y);
        }
    }

    function onSceneMouseUp(event) {
        if (grabbedObject) {
            grabbedObject = null;
        }
    }

    // --- 페이지 뼈대 (UI) ---
    container.innerHTML = `
        <div class="practice-container relative w-full h-screen text-white font-sans overflow-hidden">
            <h1 class="absolute top-10 left-1/2 -translate-x-1/2 z-10 text-4xl font-bold text-green-400 [text-shadow:_0_2px_4px_rgb(0_0_0_/_50%)]">3D 소품샵</h1>
            <p class="absolute top-20 left-1/2 -translate-x-1/2 z-10 text-gray-400 [text-shadow:_0_1px_2px_rgb(0_0_0_/_50%)]">(손동작으로 3D 물체를 클릭/드래그 해보세요)</p>
            
            <!-- Phase 2: HTML 에셋 바 컨테이너 -->
            <div id="asset-bar-container" 
                 class="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 w-11/12 max-w-md">
            </div>

            <button id="btn-practice-done" class="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200">
                연습 완료 (메인으로 이동)
            </button>
        </div>
    `;

    // --- 3D 씬 실행 ---
    initScene();

    const btnPracticeDone = container.querySelector('#btn-practice-done');

    const handleDone = () => {
        router.navigate('/simulation');
    };

    btnPracticeDone.addEventListener('click', handleDone);

    // 정리(cleanup) 함수
    return () => {
        btnPracticeDone.removeEventListener('click', handleDone);

        cleanupScene();

        console.log("Cleaning up tracking modules from PracticePage...");
        GestureTracking.stop();
        VirtualMouse.destroy();
        VideoManager.destroy();

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
