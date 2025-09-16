import face_vert from "./glsl/sim/face.vert";
import line_vert from "./glsl/sim/line.vert";

import vortex_frag from "./glsl/sim/vortex.frag";
import ShaderPass from "./ShaderPass";

import * as THREE from "three";


export default class vortex extends ShaderPass{
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

    update({ dt }){

        this.uniforms.dt.value = dt;


        super.update();
    }
}