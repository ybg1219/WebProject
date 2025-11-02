/**
 * "액터" 모듈 (VirtualMouse)
 * EventBus에서 'handUpdate' 이벤트를 구독하여,
 * 1. 가상 커서(DOM)를 화면에 그립니다.
 * 2. 손 제스처(isGrabbing) 상태 변화를 감지하여 'mousedown', 'mouseup', 'click' 이벤트를 시뮬레이션합니다.
 * 3. 실제 마우스와 가상 마우스 간의 전환을 처리합니다.
 */

import EventBus from '../utils/EventBus.js';
import GestureTracking from './GestureTracking.js'; // 센서 모듈의 'isActive' 상태 확인용

class VirtualMouse {
    constructor() {
        /**
         * 가상 커서를 나타내는 DOM 엘리먼트
         * @type {HTMLElement | null}
         */
        this.virtualCursor = null;

        /**
         * 현재 '잡기'(mousedown) 상태인지 여부를 저장
         * @type {boolean}
         */
        this.isGrabbing = false;

        // destroy에서 이벤트 리스너를 제거할 때 동일한 참조가 필요하므로,
        // 생성자에서 함수를 미리 바인딩합니다.
        this.boundOnHandUpdate = this.onHandUpdate.bind(this);
        this.boundOnHandLost = this.onHandLost.bind(this);
        this.boundOnRealMouseMove = this.onRealMouseMove.bind(this);
    }

    /**
     * VirtualMouse를 초기화합니다.
     * 가상 커서 DOM을 생성하고 EventBus 구독 및 리스너를 등록합니다.
     */
    init() {
        this.createVirtualCursor();
        this.showVirtualCursor(); // 초기 상태는 가상 커서 활성화

        // EventBus 구독
        EventBus.on('handUpdate', this.boundOnHandUpdate);
        EventBus.on('handLost', this.boundOnHandLost);

        // 실제 마우스 움직임 감지 리스너 등록
        document.addEventListener('mousemove', this.boundOnRealMouseMove);
    }

    /**
     * 실제 마우스 커서를 활성화합니다. (가상 커서 숨김)
     */
    showRealCursor() {
        if (this.virtualCursor) this.virtualCursor.style.display = 'none';
        document.body.style.cursor = 'auto';
    }

    /**
     * 가상 마우스 커서를 활성화합니다. (실제 커서 숨김)
     */
    showVirtualCursor() {
        if (this.virtualCursor) this.virtualCursor.style.display = 'block';
        document.body.style.cursor = 'none';
    }

    /**
     * 가상 커서 DOM 엘리먼트를 생성하고 body에 추가합니다.
     */
    createVirtualCursor() {
        // 이미 생성되었다면 중복 실행 방지
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
            pointer-events: none; /* 커서 자체가 클릭 이벤트를 받지 않도록 함 */
            z-index: 9999; /* 항상 최상위에 표시 */
            transform: translate(-50%, -50%); /* (0,0)을 커서의 중심으로 맞춤 */
            transition: transform 0.05s linear; /* 부드러운 이동 */
            display: none; /* 초기에는 숨김 */
        `;
        document.body.appendChild(this.virtualCursor);
    }

    /**
     * [이벤트 핸들러] 사용자가 '실제' 마우스를 움직였을 때 호출됩니다.
     * @param {MouseEvent} event
     */
    onRealMouseMove(event) {
        // event.isTrusted가 true = 사용자의 실제 하드웨어 입력
        // event.isTrusted가 false = dispatchMouseEvent로 만든 가짜 이벤트
        if (event.isTrusted) {
            this.showRealCursor(); // 실제 마우스 모드로 전환
        }
    }

    /**
     * [이벤트 핸들러] '잡기(Grabbing)' 상태 변경을 처리합니다.
     * mousedown, mouseup, click 이벤트를 적절한 시점에 발생시킵니다.
     * @param {boolean} newIsGrabbing - GestureTracking이 보낸 현재 프레임의 잡기 상태
     * @param {number} x - 현재 x 좌표
     * @param {number} y - 현재 y 좌표
     */
    handleStateChange(newIsGrabbing, x, y) {
        // 상태가 '잡기'로 변경된 순간 (false -> true)
        if (newIsGrabbing && !this.isGrabbing) {
            // Grab (mousedown)
            console.log("VirtualMouse EVENT: mousedown"); // [로그]
            this.isGrabbing = true;
            this.dispatchMouseEvent('mousedown', x, y);

            // 상태가 '놓기'로 변경된 순간 (true -> false)
        } else if (!newIsGrabbing && this.isGrabbing) {
            // Release (mouseup)
            console.log("VirtualMouse EVENT: mouseup"); // [로그]
            this.isGrabbing = false;
            this.dispatchMouseEvent('mouseup', x, y);

            // [핵심]
            // 'isTrusted: false' 이벤트는 브라우저가 'click'으로 합성해주지 않음.
            // 따라서 UI(예: LandingPage)의 'click' 리스너가 동작하도록 
            // 'click' 이벤트를 수동으로 발생시켜야 합니다.
            console.log("VirtualMouse EVENT: click (synthesized)");
            this.dispatchMouseEvent('click', x, y);
        }
    }

    /**
     * [이벤트 핸들러] EventBus 'handUpdate' (손 추적 데이터) 수신 시 호출됩니다.
     * @param {CustomEvent} event - event.detail에 {x, y, isGrabbing}이 담김
     */
    onHandUpdate(event) {
        // 손이 감지되었으므로, 가상 커서 모드로 전환
        this.showVirtualCursor();

        // [방어 코드 1] 센서(GestureTracking)가 활성화 상태인지 확인
        if (!GestureTracking.isActive) {
            console.warn('VirtualMouse: Received handUpdate, but GestureTracking is not active. Ignoring.');
            this.onHandLost(); // 강제로 '손 사라짐' 처리
            return;
        }

        // [방어 코드 2] EventBus로 받은 데이터가 유효한지 확인
        if (!event.detail || typeof event.detail.x !== 'number' || typeof event.detail.y !== 'number') {
            console.error('VirtualMouse: Received invalid handUpdate data.', event.detail);
            return;
        }

        const { x, y, isGrabbing } = event.detail;

        if (!this.virtualCursor) return;

        // 1. 가상 커서 위치 업데이트
        // (x,y) 좌표가 커서의 '중심'이 되도록 translate(-50%, -50%)를 결합
        this.virtualCursor.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;

        // 2. '잡기' 상태 변경 감지 (mousedown/mouseup/click 발생)
        this.handleStateChange(isGrabbing, x, y);

        // 3. 'mousemove'는 항상 발생 (호버링 및 드래그 감지용)
        this.dispatchMouseEvent('mousemove', x, y);
    }

    /**
     * [이벤트 핸들러] EventBus 'handLost' (손이 안 보일 때) 수신 시 호출됩니다.
     */
    onHandLost() {
        // 손이 사라지면 실제 마우스 커서로 전환
        this.showRealCursor();

        // 상태를 강제로 '놓기'로 변경 (x,y는 중요하지 않음)
        // (잡고 있던 상태로 손이 사라졌을 경우 'mouseup'을 발생시키기 위함)
        this.handleStateChange(false, 0, 0);
    }

    /**
     * 지정된 (x, y) 위치의 DOM 요소에 마우스 이벤트를 시뮬레이션(dispatch)합니다.
     * @param {string} eventName - 발생시킬 이벤트 이름 (예: 'mousedown', 'click')
     * @param {number} x - 화면 x 좌표
     * @param {number} y - 화면 y 좌표
     */
    dispatchMouseEvent(eventName, x, y) {
        // (x, y) 좌표의 최상위 요소를 찾음
        const targetElement = document.elementFromPoint(x, y);

        // [디버깅 로그]
        if (eventName === 'mousedown') {
            console.log(`Virtual Click Event at (x: ${Math.round(x)}, y: ${Math.round(y)})`);
            console.log("Clicking on Element:", targetElement);
        }

        // 타겟이 없거나, 가상 커서 자신일 경우 무시
        if (!targetElement || targetElement.id === 'virtual-cursor') return;

        // 실제 마우스 이벤트와 동일한 속성으로 이벤트 생성
        const event = new MouseEvent(eventName, {
            clientX: x,
            clientY: y,
            bubbles: true,     // 이벤트 버블링 허용
            cancelable: true,  // 기본 동작 취소 가능
            view: window        // window 객체 참조
        });

        // 대상 요소에 이벤트 발생
        targetElement.dispatchEvent(event);
    }

    /**
     * 모듈을 파괴하고, 모든 DOM 요소와 리스너를 정리합니다.
     */
    destroy() {
        // 1. EventBus 구독 해제
        EventBus.off('handUpdate', this.boundOnHandUpdate);
        EventBus.off('handLost', this.boundOnHandLost);

        // 2. 실제 마우스 리스너 제거 및 커서 복원
        document.removeEventListener('mousemove', this.boundOnRealMouseMove);
        document.body.style.cursor = 'auto';

        // 3. 가상 커서 DOM 제거
        if (this.virtualCursor) {
            this.virtualCursor.remove();
            this.virtualCursor = null;
        }
    }
}

export default new VirtualMouse();

