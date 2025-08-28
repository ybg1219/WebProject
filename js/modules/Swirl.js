import * as THREE from 'three';
import ShaderPass from "./ShaderPass";
import swirl_vert from './glsl/sim/basic.vert';
import swirl_frag from './glsl/sim/swirl.frag';

export default class Swirl extends ShaderPass {
    /**
     * @param {object} simProps - 시뮬레이션에 필요한 속성들
     */
    constructor(simProps) {
        super({
            material: {
                vertexShader: swirl_vert,
                fragmentShader: swirl_frag,
                blending: THREE.AdditiveBlending,
                uniforms: {
                    //fboSize: { value: new THREE.Vector2(simProps.src.width, simProps.src.height) },
                    // GLSL 셰이더로 전달할 유니폼 변수들
                    p0: { value: new THREE.Vector2() },     // 왼손 위치
                    p1: { value: new THREE.Vector2() },     // 오른손 위치
                    v0: { value: new THREE.Vector2() },     // 왼손의 움직임 벡터
                    v1: { value: new THREE.Vector2() },     // 오른손의 움직임 벡터
                    strength: { value: 6.0 },  
                    radius: { value: 10.0 },
                    // px: { value: simProps.cellScale },
                }
            },
            output: simProps.dst
        });

        this.init();
    }

    /**
     * 좌표를 화면 경계 내로 제한(클리핑)하는 헬퍼 함수.
     * @param {THREE.Vector2} point - 클리핑할 좌표.
     * @param {number} cursorSizeX - 커서의 X 크기 (경계 계산용).
     * @param {number} cursorSizeY - 커서의 Y 크기 (경계 계산용).
     * @param {THREE.Vector2} cellScale - 픽셀(셀) 크기.
     * @returns {THREE.Vector2} 클리핑된 좌표.
     */
    clipPoint(point, cursorSizeX, cursorSizeY, cellScale) {
        point.x = Math.min(Math.max(point.x, -1 + cursorSizeX + cellScale.x * 2), 1 - cursorSizeX - cellScale.x * 2);
        point.y = Math.min(Math.max(point.y, -1 + cursorSizeY + cellScale.y * 2), 1 - cursorSizeY - cellScale.y * 2);
        return point;
    }

    /**
     * 매 프레임 호출되어 와류 효과의 유니폼 값을 업데이트합니다.
     * @param {object} props - 외부에서 전달되는 속성들.
     * @param {object} props.leftHand - 왼손 추적 데이터.
     * @param {object} props.rightHand - 오른손 추적 데이터.
     * @param {Vector} cellScale - 1/width, 1/ height.
     * @param {number} cursor_size - 커서 사이즈 조정 파라미터, 클리핑
     * @param {number} mouse_force - 외력 크기 조정 파라미터
     */
    update(props) {
        const { leftHand, rightHand, cursor_size, cellScale, mouse_force } = props;

        // 입력 데이터가 유효한지 확인합니다.
        if (!leftHand || !rightHand) return;

        // 1. 와류가 발생할 두 점 위치, p0-p1 방향은 frag에서 계산
        const p0 = leftHand.coords;
        const p1 = rightHand.coords;

        // 3. p0와 p1을 화면 경계 내로 클리핑합니다.
        const cursorSizeX = cursor_size * cellScale.x;
        const cursorSizeY = cursor_size * cellScale.y;
        
        const clippedP0 = this.clipPoint(p0, cursorSizeX, cursorSizeY, cellScale);
        const clippedP1 = this.clipPoint(p1, cursorSizeX, cursorSizeY, cellScale);

        // 4. 계산된 값으로 셰이더 유니폼을 업데이트합니다.
        this.uniforms.p0.value.copy(clippedP0);
        this.uniforms.p1.value.copy(clippedP1);

        const forceScale = 1.0;
        this.uniforms.v0.value.copy(leftHand.diff).multiplyScalar(forceScale);
        this.uniforms.v1.value.copy(rightHand.diff).multiplyScalar(forceScale);
        
        // 힘의 세기는 force 벡터의 길이에 비례하도록 설정합니다.
        this.uniforms.strength.value = mouse_force * 0.05; // 세기를 증폭시켜 효과를 명확하게 합니다.
        
        // 와류의 영향 반경은 cursor_size에 비례하도록 설정합니다.
        this.uniforms.radius.value = cursor_size / 1000.0; // 반경 스케일을 적절히 조절합니다.

        // 5. 부모 클래스의 update를 호출하여 셰이더를 렌더링합니다.
        super.update();
    }
}