import * as THREE from "three";
import Common from "./Common";

import { VRButton } from 'three/addons/webxr/VRButton.js';

import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';
import { XRHandModelFactory } from 'three/examples/jsm/webxr/XRHandModelFactory.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

let controller1, controller2;
let controllerGrip1, controllerGrip2;
let hand1, hand2;

class Controller{
    constructor(){
        this.mouseMoved = false;
        this.coords = new THREE.Vector2();
        this.coords_old = new THREE.Vector2();
        this.diff = new THREE.Vector2();
        this.timer = null;
        this.count = 0;
    }

    init(){
        renderer.xr.enabled = true;
        
        document.body.addEventListener( 'mousemove', this.onDocumentMouseMove.bind(this), false );
        document.body.addEventListener( 'touchstart', this.onDocumentTouchStart.bind(this), false );
        document.body.addEventListener( 'touchmove', this.onDocumentTouchMove.bind(this), false );

        // 컨트롤러 설정
        setupControllers();
    }

    setCoords( x, y ) {
        if(this.timer) clearTimeout(this.timer);
        this.coords.set( ( x / Common.width ) * 2 - 1, - ( y / Common.height ) * 2 + 1 );
        this.mouseMoved = true;
        this.timer = setTimeout(() => {
            this.mouseMoved = false;
        }, 100);
    }
    // 이 코드를 VR 코드로 변경 필요.
    onDocumentMouseMove( event ) {
        this.setCoords( event.clientX, event.clientY ); //마우스 커서 좌표 (픽셀 단위) 
        // 예: 컨트롤러 트리거 버튼을 누를 때 위치를 저장
        const position = controller.position;
        this.setCoords(position.x, position.y);
    }
    onDocumentTouchStart( event ) {
        if ( event.touches.length === 1 ) {
            // event.preventDefault();
            this.setCoords( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
            // event.touches[0]: 현재 터치된 손가락들 중 첫 번째 ([0])의 터치 정보
        }
        // 예: 컨트롤러 트리거 버튼을 누를 때 위치를 저장
        const position = controller.position;
        this.setCoords(position.x, position.y);
    }
    onDocumentTouchMove( event ) {
        if ( event.touches.length === 1 ) {
            // event.preventDefault();
            this.setCoords( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
        }const position = controller.position;
        this.setCoords(position.x, position.y);
    }
    setupControllers() {
        const controllerModelFactory = new XRControllerModelFactory();
        const handModelFactory = new XRHandModelFactory();
    
        controller1 = renderer.xr.getController(0);
        
        controller1.addEventListener('selectstart', (event) => this.onSelectStart(event, controller1));
        controller1.addEventListener('selectend', (event) => this.onSelectEnd(event, controller1));
        controller1.addEventListener('connected', (event) => {
            controller1.userData.inputSource = event.data;
        });

        controller2 = renderer.xr.getController(1);

        controller2.addEventListener('selectstart', (event) => this.onSelectStart(event, controller2));
        controller2.addEventListener('selectend', (event) => this.onSelectEnd(event, controller2));
        controller2.addEventListener('connected', (event) => {
            controller2.userData.inputSource = event.data;
        });
        
        scene.add(controller1);
    
        scene.add(controller2);
    
        // controllerGrip1 = renderer.xr.getControllerGrip(0);
        // controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
        // scene.add(controllerGrip1);
    
        // controllerGrip2 = renderer.xr.getControllerGrip(1);
        // controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
        // scene.add(controllerGrip2);
        
        // hand tracking
        // hand1 = renderer.xr.getHand(0);
        // hand1.add(handModelFactory.createHandModel(hand1));
        // scene.add(hand1);
    
        // hand2 = renderer.xr.getHand(1);
        // hand2.add(handModelFactory.createHandModel(hand2));
        // scene.add(hand2);
    
        // 컨트롤러에서 나오는 선
        const geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, -1)
        ]);
    
        const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0xffffff }));
        line.name = 'line';
        line.scale.z = 5;
    
        controller1.add(line.clone());
        controller2.add(line.clone());
    }

    update(){
        this.diff.subVectors(this.coords, this.coords_old);
        this.coords_old.copy(this.coords);

        if(this.coords_old.x === 0 && this.coords_old.y === 0) this.diff.set(0, 0);
    }
}

export default new Controller();
