import * as THREE from "three";
import Common from "./Common";
//import { Pose } from "@mediapipe/pose";
import { Camera } from "@mediapipe/camera_utils";

class BodyTracking {

    constructor() {
        this.coords = new THREE.Vector2();
        this.coords_old = new THREE.Vector2();
        this.diff = new THREE.Vector2();
        this.moved = false;
        this.timer = null;

        this.videoElement = null;
        this.pose = null;
    }

    async init() {
        this.videoElement = document.getElementById('input_video');

        this.pose = await new Pose({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
        });

        this.pose.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            enableSegmentation: false,
            minDetectionConfidence: 0.7,
            minTrackingConfidence: 0.7
        });

        console.log("Pose Tracking initialized");

        this.pose.onResults(results => {
            if (results.poseLandmarks) {
                const head = results.poseLandmarks[0];

                const x = Math.floor((1 - head.x) * Common.width);
                const y = Math.floor(head.y * Common.height);
                this.setCoords(x, y);
            }
        });

        this.cameraStart();
    }

    cameraStart() {
        const camera = new Camera(this.videoElement, {
            onFrame: async () => {
                await this.pose.send({ image: this.videoElement });
            },
            width: Common.width / 10,
            height: Common.height / 10
        });
        camera.start();
    }

    setCoords(x, y) {
        if (this.timer) clearTimeout(this.timer);

        this.coords.set((x / Common.width) * 2 - 1, -(y / Common.height) * 2 + 1);
        this.moved = true;

        this.timer = setTimeout(() => {
            this.moved = false;
        }, 100);
    }

    update() {
        this.diff.subVectors(this.coords, this.coords_old);
        this.coords_old.copy(this.coords);

        if (this.coords_old.x === 0 && this.coords_old.y === 0) {
            this.diff.set(0, 0);
        }
    }

    getBody() {
        return {
            coords: this.coords,
            diff: this.diff,
            moved: this.moved
        };
    }
}

export default new BodyTracking();
