import face_vert from "./glsl/sim/face.vert";
import density_frag from "./glsl/sim/density.frag";

import ShaderPass from "./ShaderPass";

import * as THREE from "three";

export default class Density extends ShaderPass{
    constructor(simProps){
        super({
            material: {
                vertexShader: face_vert,
                fragmentShader: density_frag,
                uniforms: {
                    
                    positions : {
                        value : null
                    }, 
                    radius: {
                        value : 0.0
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
            output: simProps.dst,

            output0: simProps.den,
            output1: simProps.dst
        })
        this.landmarkMaxSize = 20;
        this.posArray = null;
        this.init();
    }


    init(simProps){
        super.init();
        this.uniforms.positions.value = new Float32Array(this.landmarkMaxSize * 2);
        this.posArray = new Float32Array(this.landmarkMaxSize * 2); // sourcePos initialize 0 automatically
    }

    update({ cursor_size ,cellScale, vel, sourcePos }) {
        
        this.uniforms.radius.value = cursor_size;
        
        // 유니폼 갱신
        this.uniforms.velocity.value = vel.texture;
        const cursorSizeX = cursor_size * cellScale.x;
        const cursorSizeY = cursor_size * cellScale.y;
        
        // 여러 개의 소스 위치를 0~1로 변환해서 각 유니폼에 전달
        const toUv = ({ x, y }) => new THREE.Vector2((x + 1.0) * 0.5, (y + 1.0) * 0.5);

        // 커서 사이즈 반영하여 스크린에서 클리핑
        const clipping = ({ x, y }) => new THREE.Vector2(
            Math.min(Math.max(x, -1 + cursorSizeX + cellScale.x * 2), 1 - cursorSizeX - cellScale.x * 2),
            Math.min(Math.max(y, -1 + cursorSizeY + cellScale.y * 2), 1 - cursorSizeY - cellScale.y * 2)
        );

        if (sourcePos.length > this.landmarkMaxSize) {
            console.warn("sourcePos overflow: ", sourcePos.length, ">", this.landmarkMaxSize);
        }

        sourcePos.forEach((pos, i) => {
            const clipped = clipping(pos);
            const uv = toUv(clipped);
            this.posArray[i * 2] = uv.x;
            this.posArray[i * 2 + 1] = uv.y;
        }); // cast 2d vector to glsl array

        this.uniforms.positions.value = this.posArray;
        this.uniforms.density.value = den0.texture;
        this.props.output = den1;

        super.update();

        // swap 역할 수행: output1 → 다음 프레임의 input
        const temp = this.props.output0;
        this.props.output0 = this.props.output1;
        this.props.output1 = temp;

        return this.props.output;
    }
}