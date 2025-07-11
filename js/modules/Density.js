import face_vert from "./glsl/sim/face.vert";
import density_frag from "./glsl/sim/density.frag";

import ShaderPass from "./ShaderPass";

import * as THREE from "three";

export default class Density extends ShaderPass{
    constructor(simProps){
        super({
            material: {
                // blending: THREE.AdditiveBlending,
                // transparent: true,
                vertexShader: face_vert,
                fragmentShader: density_frag,
                uniforms: {
                    
                    sourcePos: {
                        value: new THREE.Vector2(0.0, 0.0)
                    },
                    radius: {
                        value : 0.1
                    },
                    strength : {
                        value : 0.9
                    },
                    boundarySpace: {
                        value: simProps.boundarySpace
                    },
                    velocity: {
                        value: simProps.vel.texture
                    },
                    density: {
                        value: simProps.den.texture
                    },
                    px: {
                        value: simProps.cellScale
                    },
                    dt: {
                        value: simProps.dt
                    },
                    fboSize : {
                        value: simProps.fboSize
                    }
                }
            },
            output: simProps.dst
        })
        this.init();
    }


    init(simProps){
        super.init();
    }

    update({ vel, den, sourcePos}){
        // 아래 처럼 커서 사이즈 생각해서 clipping.
        // centerX = Math.min(Math.max(props.coords.x, -1 + cursorSizeX + props.cellScale.x * 2), 1 - cursorSizeX - props.cellScale.x * 2);
        // centerY = Math.min(Math.max(props.coords.y, -1 + cursorSizeY + props.cellScale.y * 2), 1 - cursorSizeY - props.cellScale.y * 2);
            
        const uvPos = new THREE.Vector2(
            (sourcePos.x + 1.0) * 0.5,
            (sourcePos.y + 1.0) * 0.5
        ); 
        this.uniforms.velocity.value = vel.texture;
        this.uniforms.density.value = den.texture;

        this.uniforms.sourcePos.value = uvPos; // 0-1 사이 clipping 필요.

        super.update();
        // this.uniforms.density.value = this.props.output.texture; // 읽기용으로 설정

        // swap
        // [this.uniforms.density.texture, this.props.output.texture] = [this.props.output.texture, this.uniforms.density.texture];

    }
}