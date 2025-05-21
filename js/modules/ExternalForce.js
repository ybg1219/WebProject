import mouse_vert from "./glsl/sim/mouse.vert";
import externalForce_frag from "./glsl/sim/externalForce.frag";
import ShaderPass from "./ShaderPass";
import Mouse from "./Mouse";
import HandTracking from "./HandTracking";

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
        
        let forceX, forceY, centerX, centerY;

        // console.log('[ExternalForce] update call - isMouse:', props.isMouse);
        // console.trace();
        // console.log(props.cursor_size);

        if ( props.isMouse ){
            forceX = Mouse.diff.x / 2 * props.mouse_force; // 이동속도 * 기본 마우스 force = 20
            forceY = Mouse.diff.y / 2 * props.mouse_force;
            console.log('mouse diff', forceX, forceY, props.isMouse);
            centerX = Math.min(Math.max(Mouse.coords.x, -1 + cursorSizeX + props.cellScale.x * 2), 1 - cursorSizeX - props.cellScale.x * 2);
            centerY = Math.min(Math.max(Mouse.coords.y, -1 + cursorSizeY + props.cellScale.y * 2), 1 - cursorSizeY - props.cellScale.y * 2);
        }else{ 
            forceX = HandTracking.diff.x / 2 * props.mouse_force*3; // 이동속도 * 기본 마우스 force = 20
            forceY = HandTracking.diff.y / 2 * props.mouse_force*3;
            console.log('hand diff', forceX, forceY, props.isMouse);
            centerX = Math.min(Math.max(HandTracking.coords.x, -1 + cursorSizeX + props.cellScale.x * 2), 1 - cursorSizeX - props.cellScale.x * 2);
            centerY = Math.min(Math.max(HandTracking.coords.y, -1 + cursorSizeY + props.cellScale.y * 2), 1 - cursorSizeY - props.cellScale.y * 2);
            console.log('hand pos', HandTracking.coords.x, HandTracking.coords.y);
        }
        const uniforms = this.mouse.material.uniforms;

        uniforms.force.value.set(forceX, forceY);
        uniforms.center.value.set(centerX, centerY);
        uniforms.scale.value.set(props.cursor_size, props.cursor_size);

        super.update();
    }

}