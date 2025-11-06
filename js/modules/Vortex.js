import face_vert from "./glsl/sim/face.vert";
import padding_vert from "./glsl/sim/padding.vert";

import vortex_frag from "./glsl/sim/vortex.frag";
import ShaderPass from "./ShaderPass";

import * as THREE from "three";


export default class Vortex extends ShaderPass {
    constructor(simProps) {
        super({
            material: {
                vertexShader: padding_vert,
                fragmentShader: vortex_frag,
                blending: THREE.AdditiveBlending,
                uniforms: {
                    fboSize: {
                        value: simProps.fboSize
                    },
                    dt: {
                        value: simProps.dt
                    },
                    boundarySpace: { 
                        value: simProps.cellScale 
                    },
                    px: {
                        value: simProps.cellScale
                    },
                    u_time: {
                        value: 0.0
                    },
                },
            },
            output: simProps.dst
        });

        this.init();
    }

    init() {
        super.init();
    }

    update({ fboSize }) {
        this.uniforms.fboSize.value = fboSize;
        this.uniforms.u_time.value += this.uniforms.dt.value;

        super.update();
    }
}