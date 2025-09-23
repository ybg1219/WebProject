import face_vert from "./glsl/sim/face.vert";
import density_frag from "./glsl/sim/density.frag";

import ShaderPass from "./ShaderPass";

import * as THREE from "three";
import { BODY_PART_ORDER, MAX_BODY_PARTS } from "./Simulation"; 

export default class Density extends ShaderPass{
    constructor(simProps){
        super({
            material: {
                vertexShader: face_vert,
                fragmentShader: `
                    // MAX_BODY_PARTS 정의
                    #define MAX_BODY_PARTS ${MAX_BODY_PARTS}
                    
                    // 기존 셰이더 코드
                    ${density_frag}
                `,
                uniforms: {
                    // 점 소스를 위한 좌표 배열
                    pointPositions: { value: null },
                    // 선 소스를 위한 좌표 배열
                    linePositions: { value: null },
                    // 유효한 선의 개수
                    lineCount: { value: 0 }, 
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
        this.landmarkMaxSize = MAX_BODY_PARTS;
        this.bodyConnectionIndices = [
            [BODY_PART_ORDER.indexOf('head'), BODY_PART_ORDER.indexOf('center')],
            [BODY_PART_ORDER.indexOf('center'), BODY_PART_ORDER.indexOf('leftShoulder')],
            [BODY_PART_ORDER.indexOf('center'), BODY_PART_ORDER.indexOf('rightShoulder')],
            [BODY_PART_ORDER.indexOf('center'), BODY_PART_ORDER.indexOf('heap')],
            [BODY_PART_ORDER.indexOf('heap'), BODY_PART_ORDER.indexOf('leftFoot')],
            [BODY_PART_ORDER.indexOf('heap'), BODY_PART_ORDER.indexOf('rightFoot')],
            [BODY_PART_ORDER.indexOf('rightShoulder'), BODY_PART_ORDER.indexOf('leftShoulder')],
            [BODY_PART_ORDER.indexOf('rightShoulder'), BODY_PART_ORDER.indexOf('rightHand')],
            [BODY_PART_ORDER.indexOf('leftShoulder'), BODY_PART_ORDER.indexOf('leftHand')],
        ];
        this.init();
    }


    init(){
        super.init();

        // 점 좌표 배열 초기화
        this.uniforms.pointPositions.value = new Float32Array(MAX_BODY_PARTS * 2);
        
        // 선 좌표 배열 초기화
        const maxLines = this.bodyConnectionIndices.length;
        this.uniforms.linePositions.value = new Float32Array(maxLines * 2 * 2); // 선 개수 * 점 2개 * xy 2개
    }

    update({ cursor_size ,cellScale, vel, sourcePos }) {
        
        this.uniforms.radius.value = cursor_size;
        this.uniforms.px.value = cellScale;
        // 유니폼 갱신
        this.uniforms.velocity.value = vel.texture;
        
        // 여러 개의 소스 위치를 0~1로 변환해서 각 유니폼에 전달
        const toUv = ({ x, y }) => new THREE.Vector2((x + 1.0) * 0.5, (y + 1.0) * 0.5);

        if (sourcePos.length > this.landmarkMaxSize) {
            console.warn("sourcePos overflow: ", sourcePos.length, ">", this.landmarkMaxSize);
        }
        console.log(sourcePos)
        const uvCoords = sourcePos.map(toUv);
        this.uniforms.pointPositions.value.set( new Float32Array(this.landmarkMaxSize));
        this.uniforms.linePositions.value.set( new Float32Array(this.landmarkMaxSize/2)); 

        for (let i = 0; i < uvCoords.length; i++) {
            if (uvCoords[i].x <= -2.0 && uvCoords[i].y <= -2.0) return;
            this.uniforms.pointPositions.value[i * 2] = uvCoords[i].x;
            this.uniforms.pointPositions.value[i * 2 + 1] = uvCoords[i].y;
        }

        // 3. 선 소스(Line Source) 데이터 채우기
        const validLineCoords = [];
        this.bodyConnectionIndices.forEach(([indexA, indexB]) => {

            if (indexA === -1 || indexB === -1) return; // BODY_PART_ORDER에 없는 이름일 경우 예외처리
            
            const partA = uvCoords[indexA];
            const partB = uvCoords[indexB];
            
            // 두 점이 모두 유효한 경우에만 (sentinel 값이 아닐 경우) 선 목록에 추가합니다.
            // toUv 변환 후 sentinel 값은 음수가 되므로, x >= 0.0 으로 유효성을 검사할 수 있습니다.
            if (partA && partB && partA.x >= 0.0 && partB.x >= 0.0) {
                validLineCoords.push(partA.x, partA.y, partB.x, partB.y);
            }
        });

        // 유효한 선 데이터를 Float32Array에 복사하고, 유효한 선의 개수를 업데이트합니다.
        this.uniforms.linePositions.value.set(validLineCoords);
        this.uniforms.lineCount.value = validLineCoords.length / 4; // 선 하나당 4개의 float

        // Ping-Pong 스왑
        const den0 = this.props.output0;
        const den1 = this.props.output1;

        this.uniforms.density.value = den0.texture;
        this.props.output = den1;

        super.update();

        // swap 역할 수행: output1 → 다음 프레임의 input
        const temp = den0;
        this.props.output0 = den1;
        this.props.output1 = temp;

        return this.props.output;
    }
}