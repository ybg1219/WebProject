import mouse_vert from "./glsl/sim/mouse.vert";
import externalForce_frag from "./glsl/sim/externalForce.frag";
import ShaderPass from "./ShaderPass";
// import Mouse from "./Mouse"; // -> simulation에서 파라미터로 받고 있음.
// import HandTracking from "./HandTracking";

import * as THREE from "three";

export default class ExternalForce extends ShaderPass{
    constructor(simProps){
        super({
            output: simProps.dst
        });

        this.init(simProps);
    }

    init(simProps){
        super.init();
        const mouseG = new THREE.PlaneGeometry(
            1, 1
        );

        // (0.5, 0, 0) (빨강) + (0, 0.5, 0) (초록) = (0.5, 0.5, 0) (노랑)
        const mouseM = new THREE.RawShaderMaterial({
            vertexShader: mouse_vert,
            fragmentShader: externalForce_frag,
            blending: THREE.AdditiveBlending,
            uniforms: {
                px: {
                    value: simProps.cellScale
                },
                force: {
                    value: new THREE.Vector2(0.0, 0.0)
                },
                center: {
                    value: new THREE.Vector2(0.0, 0.0)
                },
                scale: {
                    value: new THREE.Vector2(simProps.cursor_size, simProps.cursor_size)
                }
            },
        })

        this.mouse = new THREE.Mesh(mouseG, mouseM);
        this.scene.add(this.mouse);
    }

    update(props){
        
        const cursorSizeX = props.cursor_size * props.cellScale.x;
        const cursorSizeY = props.cursor_size * props.cellScale.y;
        
        let forceX = 0, forceY = 0, centerX = 0, centerY = 0;

            forceX = props.diff.x / 2 * props.mouse_force; // 이동속도 * 기본 마우스 force = 20
            forceY = props.diff.y / 2 * props.mouse_force;
            // console.log('hand diff', forceX, forceY, props.isMouse);
            centerX = Math.min(Math.max(props.coords.x, -1 + cursorSizeX + props.cellScale.x * 2), 1 - cursorSizeX - props.cellScale.x * 2);
            centerY = Math.min(Math.max(props.coords.y, -1 + cursorSizeY + props.cellScale.y * 2), 1 - cursorSizeY - props.cellScale.y * 2);
            // console.log('hand pos', HandTracking.coords.x, HandTracking.coords.y);
        
        const uniforms = this.mouse.material.uniforms;

        uniforms.force.value.set(forceX, forceY);
        uniforms.center.value.set(centerX, centerY);
        uniforms.scale.value.set(props.cursor_size, props.cursor_size);

        super.update();
    }

}