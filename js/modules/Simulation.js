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

import Mouse from "./Mouse";
import HandTracking from "./HandTracking";
import BodyTracking from "./BodyTracking";
import Tracking from "./Tracking";

export default class Simulation{
    constructor(props){
        this.props = props;

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

        this.gradient = new Gradient({ // Density constructor radius 추가됨. 조절 여부?
            cellScale: this.cellScale,
            boundarySpace: this.boundarySpace,
            src: this.fbos.density_0,
            dst: this.fbos.gradient,
            fboSize: this.fboSize,
            dt: this.options.dt,
        });
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

    mergeForcesToVelocity() {
        
        Common.renderer.setRenderTarget(this.fbos.vel_1);
        Common.renderer.render(this.scene, this.camera); // 반드시 full-screen quad로 구성된 scene
        Common.renderer.setRenderTarget(null);
    }
    update(){
        
        
        if(this.options.isBounce){ // 경계 여부
            this.boundarySpace.set(0, 0);
        } else {
            this.boundarySpace.copy(this.cellScale);
        }

        this.advection.update(this.options);

        if (this.options.isMouse){
            this.externalForce.update({
                cursor_size: this.options.cursor_size,
                mouse_force: this.options.mouse_force,
                cellScale: this.cellScale,
                coords: Mouse.coords,
                diff: Mouse.diff
            });
        }else{

            // this.externalForceTracking.update({
            //     cursor_size: this.options.cursor_size,
            //     mouse_force: this.options.mouse_force,
            //     cellScale: this.cellScale,
            //     coords: Tracking.coords,
            //     diff: Tracking.diff
            // });
            const head = BodyTracking.getBody(0);
            this.externalForceBody.update({
               cursor_size: this.options.cursor_size,
               mouse_force: this.options.mouse_force,
               cellScale: this.cellScale,
               coords: head.coords,
               diff: head.diff
            });
            //console.log("body" , head.moved)


            // const leftHand = HandTracking.getHand(0);
            // const rightHand = HandTracking.getHand(1);

            const leftHand = BodyTracking.getBody(1);
            const rightHand = BodyTracking.getBody(2);

            // console.log(leftHand, rightHand);
            // 왼손
            if (leftHand.moved) {
                this.externalForceLeft.update({
                    cursor_size: this.options.cursor_size,
                    mouse_force: this.options.mouse_force,
                    cellScale: this.cellScale,
                    coords: leftHand.coords,
                    diff: leftHand.diff
                });
            }
            //console.log("left" , leftHand.moved);

            // 오른손
            if (rightHand.moved) {
                this.externalForceRight.update({
                    cursor_size: this.options.cursor_size,
                    mouse_force: this.options.mouse_force,
                    cellScale: this.cellScale,
                    coords: rightHand.coords,
                    diff: rightHand.diff
                });
            }
            //console.log("right", rightHand.moved);
        }

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

        vel = this.fbos.vel_1;
        const wholeBody = BodyTracking.getWholeBody()
        this.density.update(
        {   
            cursor_size: this.options.cursor_size,
            cellScale: this.cellScale,
            vel: vel,
            sourcePos: wholeBody.coords
        });

        this.gradient.update()
    }
}