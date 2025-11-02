// "액터" 모듈: EventBus에서 'handUpdate' 이벤트를 받아
// 가상 커서를 그리고 MouseEvent를 발생시킵니다.

import EventBus from '../utils/EventBus.js';
import GestureTracking from './GestureTracking.js'; // [수정] 센서 모듈을 직접 import

class VirtualMouse {
    constructor() {
        this.virtualCursor = null;
        this.isGrabbing = false; // 내부 상태로 '잡기' 동작 관리

        // EventBus에서 수신한 함수를 바인딩합니다.
        // destroy에서 off 할 때 동일한 참조가 필요하기 때문입니다.
        this.boundOnHandUpdate = this.onHandUpdate.bind(this);
        this.boundOnHandLost = this.onHandLost.bind(this);
        this.boundOnRealMouseMove = this.onRealMouseMove.bind(this);
    }

    /**
     * VirtualMouse를 초기화하고, EventBus 구독을 시작합니다.
     */
    init() {
        // 1. 가상 커서 생성
        this.createVirtualCursor();
        this.showVirtualCursor();

        // 2. EventBus 구독 시작
        EventBus.on('handUpdate', this.boundOnHandUpdate);
        EventBus.on('handLost', this.boundOnHandLost);

        // 사용자의 실제 마우스 움직임 감지 event 리스너 추가
        document.addEventListener('mousemove', this.boundOnRealMouseMove);
    }


    // 실제 마우스 커서를 활성화하는 함수
    showRealCursor() {
        if (this.virtualCursor) this.virtualCursor.style.display = 'none';  // 가상 커서 숨기기
        document.body.style.cursor = 'auto';                                // 실제 커서 보이기
    }

    // 가상 마우스 커서를 활성화하는 함수
    showVirtualCursor() {
        if (this.virtualCursor) this.virtualCursor.style.display = 'block'; // 가상 커서 보이기
        document.body.style.cursor = 'none';                                // 실제 커서 숨기기
    }

    /**
     * 가상 커서 DOM 엘리먼트를 생성하고 body에 추가합니다.
     */
    createVirtualCursor() {
        if (this.virtualCursor) return;

        this.virtualCursor = document.createElement('div');
        this.virtualCursor.id = 'virtual-cursor';
        this.virtualCursor.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 20px;
            height: 20px;
            background: rgba(0, 150, 255, 0.7);
            border: 2px solid white;
            border-radius: 50%;
            pointer-events: none; 
            z-index: 9999;
            transform: translate(-50%, -50%);
            transition: transform 0.05s linear;
            display: none; /* 초기에는 숨김 */
        `;
        document.body.appendChild(this.virtualCursor);
    }

    onRealMouseMove(event) {
        // event.isTrusted가 true이면, 시뮬레이션된 이벤트가 아닌
        // 사용자의 실제 하드웨어 입력(마우스)을 의미합니다.
        if (event.isTrusted) {
            this.showRealCursor();
        }
    }

    // '잡기' 상태 변경을 처리하는 헬퍼 함수
    handleStateChange(newIsGrabbing, x, y) {
        if (newIsGrabbing && !this.isGrabbing) { // 다운아닐 때 다운 입력 들어옴.
            // Grab (mousedown)
            console.log("VirtualMouse EVENT: mousedown"); // [로그]
            this.isGrabbing = true;
            this.dispatchMouseEvent('mousedown', x, y);
        } else if (!newIsGrabbing && this.isGrabbing) { // 다운 일때 업 입력 들어옴.
            // Release (mouseup)
            console.log("VirtualMouse EVENT: mouseup"); // [로그]
            this.isGrabbing = false;
            this.dispatchMouseEvent('mouseup', x, y);
            console.log("VirtualMouse EVENT: click (synthesized)");
            this.dispatchMouseEvent('click', x, y); // 버튼이 클릭이벤트를 기대함으로 임시 추가. 나중에 해결 필요.
        }
    }

    /**
     * 'handUpdate' 이벤트 수신 시 호출됩니다.
     * @param {CustomEvent} event - event.detail에 {x, y, isGrabbing}이 담김
     */
    onHandUpdate(event) {
        this.showVirtualCursor();

        // [수정] 1. 센서가 활성화 상태인지 직접 확인 (사용자 요청)
        if (!GestureTracking.isActive) {
            console.warn('VirtualMouse: Received handUpdate, but GestureTracking is not active. Ignoring.');
            // 센서가 꺼졌으므로, 강제로 '놓기' 상태로 만듭니다.
            this.onHandLost();
            return;
        }

        // [수정] 2. 이벤트 데이터가 유효한지 검사
        if (!event.detail || typeof event.detail.x !== 'number' || typeof event.detail.y !== 'number') {
            console.error('VirtualMouse: Received invalid handUpdate data.', event.detail);
            return;
        }

        const { x, y, isGrabbing } = event.detail;

        if (!this.virtualCursor) return;

        // 1. 가상 커서 위치 업데이트
        this.virtualCursor.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;

        // 2. '잡기' 상태 변경 감지
        // if (isGrabbing) {
        //     // -- 상태: 핀치 (손 접음) --
        //     if (!this.isGrabbing) {
        //         // '잡기'가 시작된 순간
        //         this.isGrabbing = true;
        //         this.dispatchMouseEvent('mousedown', x, y);
        //     }
        //     // '잡고 있는' 동안 계속 mousemove
        //     this.dispatchMouseEvent('mousemove', x, y);

        // } else {
        //     // -- 상태: 폄 (손 폄) --
        //     if (this.isGrabbing) {
        //         // '놓기'가 시작된 순간
        //         this.isGrabbing = false;
        //         this.dispatchMouseEvent('mouseup', x, y);
        //     }
        //     // '놓고 있는' 동안 계속 mousemove (호버링)
        //     this.dispatchMouseEvent('mousemove', x, y);
        // }

        this.handleStateChange(isGrabbing, x, y);

        // 3. '잡고 있는' 동안 계속 mousemove 이벤트 발생
        this.dispatchMouseEvent('mousemove', x, y);
    }

    /**
     * 'handLost' 이벤트 수신 시 (손이 안 보일 때) 커서를 숨깁니다.
     */
    onHandLost() {
        // 손이 사라지면 실제 마우스 커서로 전환
        this.showRealCursor();

        // if (this.virtualCursor) {
        //     this.virtualCursor.style.display = 'none';
        // }
        // // 만약 잡고 있다가 손이 사라진 경우 'mouseup'을 강제로 발생
        // if (this.isGrabbing) {
        //     this.isGrabbing = false;
        //     // 마지막 위치는 알 수 없으므로, (0,0)이나 
        //     // 현재 커서 위치에서 이벤트를 발생시킬 수 있으나, 여기서는 생략
        //     console.log("Grabbing released due to hand lost");
        // }
        this.handleStateChange(false, 0, 0); // (x,y는 중요하지 않음)
    }

    /**
     * 지정된 위치의 요소에 마우스 이벤트를 시뮬레이션합니다.
     * (이 함수는 기존 tracking.js와 동일)
     */
    dispatchMouseEvent(eventName, x, y) {
        const targetElement = document.elementFromPoint(x, y);
        if (eventName === 'mousedown') {
            console.log(`Virtual Click Event at (x: ${Math.round(x)}, y: ${Math.round(y)})`);
            console.log("Clicking on Element:", targetElement);
        }

        if (!targetElement || targetElement.id === 'virtual-cursor') return;

        const event = new MouseEvent(eventName, {
            clientX: x,
            clientY: y,
            bubbles: true,
            cancelable: true,
            view: window
        });
        targetElement.dispatchEvent(event);
    }

    /**
     * 모듈을 파괴하고, DOM/리스너를 정리합니다.
     */
    destroy() {
        // 1. EventBus 구독 해제
        EventBus.off('handUpdate', this.boundOnHandUpdate);
        EventBus.off('handLost', this.boundOnHandLost);

        // 2. 실제 커서 복원
        document.removeEventListener('mousemove', this.boundOnRealMouseMove);

        document.body.style.cursor = 'auto';

        // 3. 가상 커서 제거
        if (this.virtualCursor) {
            this.virtualCursor.remove();
            this.virtualCursor = null;
        }
    }
}

export default new VirtualMouse();
