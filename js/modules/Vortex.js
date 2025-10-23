import face_vert from "./glsl/sim/face.vert";

import vortex_frag from "./glsl/sim/vortex.frag";
import ShaderPass from "./ShaderPass";

import * as THREE from "three";


export default class Vortex extends ShaderPass{
    constructor(simProps){
        super({
            material: {
                vertexShader: face_vert,
                fragmentShader: vortex_frag,
                blending: THREE.AdditiveBlending,
                uniforms: {
                    fboSize: {
                        value: simProps.fboSize
                    },
                    dt: {
                        value: simProps.dt
                    },
                    px: {
                        value: simProps.cellScale
                    },
                    u_time: {
                        value : 0.0
                    },
                },
            },
            output: simProps.dst
        });

        this.init();
    }

    init(){
        super.init();
    }

    update({ vel , fboSize}){
        this.uniforms.fboSize.value = fboSize;
        this.uniforms.u_time.value += this.uniforms.dt.value;

        super.update();
    }
}