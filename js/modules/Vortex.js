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
                        value: simProps.src.texture
                    },
                    dt: {
                        value: simProps.dt
                    },
                    px: {
                        value: simProps.px
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

    update({ dt, vel , fboSize, px}){

        this.uniforms.dt.value = dt;
        this.uniforms.velocity.value = vel;
        this.uniforms.fboSize.value = fboSize;
        this.uniformss.px.value = px;


        super.update();
    }
}