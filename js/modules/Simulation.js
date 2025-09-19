import Common from "./Common";
import * as THREE from "three";
import Controls from "./Controls";

import Advection from "./Advection";
import ExternalForce from "./ExternalForce";
import Viscous from "./Viscous";
import Divergence from "./Divergence";
import Poisson from "./Poisson";
import Pressure from "./Pressure";
import Density from "./Density";
import Gradient from "./Gradient";
import Swirl from "./Swirl";
import Vortex from "./Vortex"

import Mouse from "./Mouse";

export const BODY_PART_ORDER = [
    'head',         // 0
    'center',       // 1 (neck 대신)
    'rightShoulder',// 2
    'rightHand',    // 3 
    'leftShoulder', // 4
    'leftHand',     // 5
    'heap',         // 6 (pelvis 대신)
    'rightFoot',    // 7
    'leftFoot'      // 8
];

// GLSL의 MAX_POSITIONS와 일치시켜야 합니다.
export const MAX_BODY_PARTS = BODY_PART_ORDER.length; // 9

// 유효하지 않은 좌표를 나타내는 특수 값 (sentinel value)
const INACTIVE_VEC2 = new THREE.Vector2(-10.0, -10.0);


export default class Simulation{
    constructor(props){
        //this.props = props;
        this.activeTracker = props.activeTracker;

        this.fbos = {
            density_0: null,
            density_1: null,
            vel_0: null,
            vel_1: null,

            // for calc next velocity with viscous
            vel_viscous0: null,
            vel_viscous1: null,

            // for calc pressure
            div: null,

            // for calc poisson equation 
            pressure_0: null,
            pressure_1: null,

            gradient : null,
        };

        this.options = { // reference 값으로 변경 하자마자 값이 바뀜.
            iterations_poisson: 32,
            iterations_viscous: 32,
            mouse_force: 20,
            resolution: 0.5,
            cursor_size: 100,
            viscous: 30,
            isBounce: false,
            dt: 0.014,
            isViscous: false,
            BFECC: true,
            isMouse : false
        }; // 컨트롤의 파라미터 초기값
        const controls = new Controls(this.options);
        this.fboSize = new THREE.Vector2();
        this.cellScale = new THREE.Vector2();
        this.boundarySpace = new THREE.Vector2();
        

        this.init();
    }

    
    init(){
        this.calcSize();
        this.createAllFBO();
        this.createShaderPass();
    }

    createAllFBO(){
        const type = ( /(iPad|iPhone|iPod)/g.test( navigator.userAgent ) ) ? THREE.HalfFloatType : THREE.FloatType;
        // / /g 정규식 리터럴 안에 문자 넣고, or 연산자 | 사용

        for(let key in this.fbos){ // fbos 를 돌면서 fbo에 RT 할당.
            this.fbos[key] = new THREE.WebGLRenderTarget(
                this.fboSize.x,
                this.fboSize.y,
                { type: type }
            );
        }   
    }

    createShaderPass(){
        this.advection = new Advection({
            cellScale: this.cellScale,
            fboSize: this.fboSize,
            dt: this.options.dt,
            src: this.fbos.vel_0,
            dst: this.fbos.vel_1
        });

        this.externalForce = new ExternalForce({
            cellScale: this.cellScale,
            cursor_size: this.options.cursor_size,
            dst: this.fbos.vel_1,
        });

        this.externalForceTracking = new ExternalForce({
            cellScale: this.cellScale,
            cursor_size: this.options.cursor_size,
            dst: this.fbos.vel_1,
        });

        this.externalForceLeft = new ExternalForce({
            cellScale: this.cellScale,
            cursor_size: this.options.cursor_size,
            dst: this.fbos.vel_1,
        });
        this.externalForceRight = new ExternalForce({
            cellScale: this.cellScale,
            cursor_size: this.options.cursor_size,
            dst: this.fbos.vel_1,
        });
        this.externalForceBody = new ExternalForce({
            cellScale: this.cellScale,
            cursor_size: this.options.cursor_size,
            dst: this.fbos.vel_1,
        });
        this.swirl = new Swirl({
            cellScale: this.cellScale,
            cursor_size: this.options.cursor_size,
            dst: this.fbos.vel_1,
        });
        
        this.viscous = new Viscous({
            cellScale: this.cellScale,
            boundarySpace: this.boundarySpace,
            viscous: this.options.viscous,
            src: this.fbos.vel_1,
            dst: this.fbos.vel_viscous1,
            dst_: this.fbos.vel_viscous0,
            dt: this.options.dt,
        });

        this.divergence = new Divergence({
            cellScale: this.cellScale,
            boundarySpace: this.boundarySpace,
            src: this.fbos.vel_viscous0,
            dst: this.fbos.div,
            dt: this.options.dt,
        });

        this.poisson = new Poisson({
            cellScale: this.cellScale,
            boundarySpace: this.boundarySpace,
            src: this.fbos.div,
            dst: this.fbos.pressure_1,
            dst_: this.fbos.pressure_0,
        });

        this.pressure = new Pressure({
            cellScale: this.cellScale,
            boundarySpace: this.boundarySpace,
            src_p: this.fbos.pressure_0,
            src_v: this.fbos.vel_viscous0,
            dst: this.fbos.vel_0,
            dt: this.options.dt,
        });

        this.density = new Density({ // Density constructor radius 추가됨. 조절 여부?
            cellScale: this.cellScale,
            boundarySpace: this.boundarySpace,
            cursor_size: this.options.cursor_size,
            vel: this.fbos.vel_0,
            den: this.fbos.density_0,
            dst: this.fbos.density_1,
            fboSize: this.fboSize,
            dt: this.options.dt,
        });

        this.gradient = new Gradient({
            cellScale: this.cellScale,
            src: this.fbos.density_0,
            dst: this.fbos.gradient,
            fboSize: this.fboSize,
            dt: this.options.dt,
        });
        // this.vortex = new Vortex({
        //     cellScale: this.cellScale,
        //     velocity: this.fbos.vel_0,
        //     dst: this.fbos.vel_1,
        //     fboSize: this.fboSize,
        //     dt: this.options.dt,
        // });
    }

    calcSize(){
        const width = Math.round(this.options.resolution * Common.width);
        const height = Math.round(this.options.resolution * Common.height);
        console.log(`격자 해상도 : ${width} x ${height}`)
        const px_x = 1.0 / width;
        const px_y = 1.0 / height;

        this.cellScale.set(px_x, px_y);
        this.fboSize.set(width, height);
    }

    resize(){
        this.calcSize();

        for(let key in this.fbos){
            this.fbos[key].setSize(this.fboSize.x, this.fboSize.y);
        }
    }

    /**
     * 특정 신체 부위에 외부 힘을 적용하는 헬퍼 함수.
     * @param {object} part - { coords, diff, moved } 속성을 가진 신체 부위 객체.
     * @param {object} forceUpdater - 힘을 업데이트하는 셰이더 래퍼 객체.
     */
    applyExternalForce(part, forceUpdater) {
        if (part && part.moved) {
            forceUpdater.update({
                cursor_size: this.options.cursor_size,
                mouse_force: this.options.mouse_force,
                cellScale: this.cellScale,
                coords: part.coords,
                diff: part.diff
            });
        }
    }

    /**
     * 한 사람의 신체 데이터에서 유효한 경계 내의 좌표만 필터링하여 반환합니다.
     * @param {object} person - head, leftHand 등이 포함된 한 사람의 객체
     * @returns {THREE.Vector2[]} 유효한 좌표(Vector2)들의 배열
     */
    _getFilteredBodyCoords(person) {
        // 1. 유효 영역 경계 계산
        const cursorSize = this.options.cursor_size;
        const boundaryX = 1.0 - (cursorSize * this.cellScale.x) - (this.cellScale.x * 2.0);
        const boundaryY = 1.0 - (cursorSize * this.cellScale.y) - (this.cellScale.y * 2.0);

        const filteredCoords = [];

        // 2. person 객체의 모든 신체 부위를 순회
        for (const [partName, partData] of Object.entries(person)) {
            console.log(partName, partData);
            if (partData?.coords) {
                const pos = partData.coords;
                const isInside = pos.x > -boundaryX && pos.x < boundaryX &&
                                 pos.y > -boundaryY && pos.y < boundaryY;
                
                if (isInside) {
                    // 경계 내에 있을 때만 객체에 해당 부위를 추가합니다.
                    filteredCoords[partName] = partData;
                }
            }
        }

        // BODY_PART_ORDER를 순회하며 순수한 좌표 배열을 생성합니다.
        // const filteredCoords = BODY_PART_ORDER.map(partName => {
        //     const part = person[partName];
        //     if (part?.coords) {
        //         const pos = part.coords;
        //         const isInside = pos.x > -boundaryX && pos.x < boundaryX &&
        //                          pos.y > -boundaryY && pos.y < boundaryY;
                
        //         return isInside ? pos : INACTIVE_VEC2;
        //     }
        //     return INACTIVE_VEC2;
        // });
        return filteredCoords;
    }

    update(){
        // --- 0. 데이터 준비: 트래커로부터 사용자 정보를 한 번만 가져옵니다. ---
        const people = this.activeTracker ? this.activeTracker.getPeople() : [];

        // --- 1. 경계 및 이류(Advection) 계산 ---
        if(this.options.isBounce){ // 경계 여부
            this.boundarySpace.set(0, 0);
        } else {
            this.boundarySpace.copy(this.cellScale);
        }

        this.advection.update(this.options);

        
        let allBodyCoords = [];
        // --- 2. 외부 힘(External Forces) 적용 ---
        if (this.options.isMouse) {
            this.applyExternalForce(Mouse, this.externalForce);
        } else if (this.activeTracker) {
            
            allBodyCoords = people.map(person => this._getFilteredBodyCoords(person))
            console.log(allBodyCoords)
            allBodyCoords.forEach(person => {
                this.applyExternalForce(person.head, this.externalForceBody);
                this.applyExternalForce(person.leftHand, this.externalForceLeft);
                // console.log("left", person.leftHand.coords, "diff", person.leftHand.diff);
                this.applyExternalForce(person.rightHand, this.externalForceRight);
                // console.log("right", person.rightHand.coords, "diff", person.rightHand.diff);
                
                // --- 양손을 이용한 Swirl 효과 적용 ---
                const { leftHand, rightHand } = person;

                // 양손이 모두 감지되고 움직였을 때만 와류를 생성합니다.
                if (leftHand && leftHand.moved && rightHand && rightHand.moved) {
                    this.swirl.update({
                        leftHand: leftHand,
                        rightHand: rightHand,
                        cursor_size: this.options.cursor_size,
                        cellScale: this.cellScale,
                        mouse_force: this.options.mouse_force // 힘의 세기 조절
                    });
                }
            });
        }

        // --- 3. 유체 물리 계산 ---
        let vel = this.fbos.vel_1;

        if(this.options.isViscous){
            vel = this.viscous.update({
                viscous: this.options.viscous,
                iterations: this.options.iterations_viscous,
                dt: this.options.dt
            });
        }

        this.divergence.update({vel});

        const pressure = this.poisson.update({
            iterations: this.options.iterations_poisson,
        });

        this.pressure.update({ vel , pressure});

        //--- 4. 밀도(Density) 업데이트 ---
        vel = this.fbos.vel_1;

        // this.vortex.update({vel : vel, fboSize: this.fboSize});
        allBodyCoords.forEach(person => {
            const personSourcePos = Object.values(person).map(part => part.coords);;

            // 한 사람의 좌표 배열(sourcePos)을 전달하여 density를 업데이트합니다.
            this.density.update({
                cursor_size: this.options.cursor_size,
                cellScale: this.cellScale,
                vel: vel,
                sourcePos: personSourcePos
            });
        });

        this.gradient.update()
    }
}