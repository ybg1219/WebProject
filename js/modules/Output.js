import Common from "./Common";
import * as THREE from "three";

import Simulation from "./Simulation";
import face_vert from "./glsl/sim/face.vert";
import color_frag from "./glsl/sim/color.frag";

export default class Output{
     /**
     * @param {object} props - Webgl.js에서 전달받는 속성. { activeTracker, options }를 포함합니다.
     */
    constructor(props) {
        this.init(props);
    }

    /**
     * @param {object} props - 생성자에서 전달받은 활성화된 tracking 모듈
     */
    init(props) {
        this.simulation = new Simulation(props);

        this.scene = new THREE.Scene();
        this.camera = new THREE.Camera();

        this.output = new THREE.Mesh(
            new THREE.PlaneGeometry(2, 2),
            new THREE.RawShaderMaterial({
                vertexShader: face_vert,
                fragmentShader: color_frag,
                uniforms: {
                    density: {
                        value: this.simulation.fbos.vel_1.texture
                    },
                    boundarySpace: {
                        value: new THREE.Vector2()
                    }
                },
            })
        );

        this.scene.add(this.output);
    }
    addScene(mesh){
        this.scene.add(mesh);
    }

    resize(){
        this.simulation.resize();
    }

    render(){
        Common.renderer.setRenderTarget(null);
        Common.renderer.render(this.scene, this.camera);
    }

    update(){
        // console.log("output render")
        this.simulation.update();
        this.render();
    }
}