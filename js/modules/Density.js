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
                    
                    head: {
                        value: new THREE.Vector2(0.0, 0.0)
                    },
                    left: {
                        value: new THREE.Vector2(0.0, 0.0)
                    },
                    right: {
                        value: new THREE.Vector2(0.0, 0.0)
                    },
                    center: {
                        value: new THREE.Vector2(0.0, 0.0)
                    },
                    bottom: {
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
            output: simProps.dst,

            output0: simProps.den,
            output1: simProps.dst
        })
        this.init();
    }


    init(simProps){
        super.init();
    }

    update({ vel, sourcePos }) {

        // 아래 처럼 커서 사이즈 생각해서 clipping.
        // centerX = Math.min(Math.max(props.coords.x, -1 + cursorSizeX + props.cellScale.x * 2), 1 - cursorSizeX - props.cellScale.x * 2);
        // centerY = Math.min(Math.max(props.coords.y, -1 + cursorSizeY + props.cellScale.y * 2), 1 - cursorSizeY - props.cellScale.y * 2);
        
        
        // 유니폼 갱신
        this.uniforms.velocity.value = vel.texture;
        
        // 여러 개의 소스 위치를 0~1로 변환해서 각 유니폼에 전달
        const toUv = ({ x, y }) => new THREE.Vector2((x + 1.0) * 0.5, (y + 1.0) * 0.5);

        this.uniforms.head.value = toUv(sourcePos.head);
        this.uniforms.left.value = toUv(sourcePos.left);
        this.uniforms.right.value = toUv(sourcePos.right);
        this.uniforms.center.value = toUv(sourcePos.center);
        this.uniforms.bottom.value = toUv(sourcePos.bottom);

        // sourcePos 변환
        // const uvPos = new THREE.Vector2(
        //     (sourcePos.x + 1.0) * 0.5,
        //     (sourcePos.y + 1.0) * 0.5
        // );
        // this.uniforms.head.value = uvPos;

        // Ping-Pong 스왑
        const den0 = this.props.output0;
        const den1 = this.props.output1;

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