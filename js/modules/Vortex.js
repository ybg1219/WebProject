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
                uniforms: {
                    fboSize: {
                        value: simProps.fboSize
                    },
                    velocity: {
                        value: simProps.velocity.texture
                    },
                    dt: {
                        value: simProps.dt
                    },
                    px: {
                        value: simProps.cellScale
                    }
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

        this.uniforms.velocity.value = vel;
        this.uniforms.fboSize.value = fboSize;

        super.update();

        // swap 역할 수행: output1 → 다음 프레임의 input
        const temp = this.props.output0;
        this.props.output0 = this.props.output1;
        this.props.output1 = temp;
    }
}