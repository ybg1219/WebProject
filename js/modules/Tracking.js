import * as THREE from "three";
import { FilesetResolver, HandLandmarker, PoseLandmarker, DrawingUtils } from "@mediapipe/tasks-vision";
import Common from "./Common";

class Tracking {
    constructor() {
        this.handLandmarker = null;
        this.poseLandmarker = null;
        this.video = null;
        this.ctx = null;

        this.handsData = [this.createHandData(), this.createHandData()];
        this.bodyData = this.createBodyData();

        this.running = false;
    }

    createHandData() {
        return {
            coords: new THREE.Vector2(),
            coords_old: new THREE.Vector2(),
            diff: new THREE.Vector2(),
            timer: null,
            moved: false
        };
    }

    createBodyData() {
        return {
            coords: new THREE.Vector2(),
            coords_old: new THREE.Vector2(),
            diff: new THREE.Vector2(),
            timer: null,
            moved: false
        };
    }

    async init() {
        this.video = document.getElementById("input_video");
        
        const fileset = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
        );

        this.handLandmarker = await HandLandmarker.createFromOptions(fileset, {
            baseOptions: {
                modelAssetPath: "/models/hand_landmarker.task",
                wasmBinaryPath: "/wasm/vision_wasm_internal.wasm",
            },
            runningMode: "VIDEO",
            numHands: 2
        });

        this.poseLandmarker = await PoseLandmarker.createFromOptions(fileset, {
            baseOptions: {
                modelAssetPath: `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/pose_landmarker_lite.task`
            },
            runningMode: "VIDEO"
        });

        this.startTracking();
    }

    startTracking() {
        this.running = true;

        const process = async () => {
            if (!this.running) return;

            const now = performance.now();

            // Pose
            const poseResult = await this.poseLandmarker.detectForVideo(this.video, now);
            if (poseResult.landmarks && poseResult.landmarks.length > 0) {
                const head = poseResult.landmarks[0];

                const x = (1 - head.x) * Common.width;
                const y = head.y * Common.height;
                this.setCoords(this.bodyData, x, y);
            }

            // Hands
            const handResult = this.handLandmarker.detectForVideo(this.video, now);
            if (handResult.landmarks && handResult.landmarks.length > 0) {
                handResult.landmarks.forEach((landmarks, i) => {
                    const indexTip = landmarks[8];
                    const x = (1 - indexTip.x) * Common.width;
                    const y = indexTip.y * Common.height;
                    this.setCoords(this.handsData[i], x, y);
                });
            }

            requestAnimationFrame(process);
        };

        process();
    }

    stopTracking() {
        this.running = false;
    }

    setCoords(data, x, y) {
        if (data.timer) clearTimeout(data.timer);

        data.coords.set((x / Common.width) * 2 - 1, -(y / Common.height) * 2 + 1);
        data.moved = true;

        data.timer = setTimeout(() => {
            data.moved = false;
        }, 100);
    }

    update() {
        // hands
        for (let i = 0; i < this.handsData.length; i++) {
            const hand = this.handsData[i];
            hand.diff.subVectors(hand.coords, hand.coords_old);
            hand.coords_old.copy(hand.coords);
        }

        // body
        const body = this.bodyData;
        body.diff.subVectors(body.coords, body.coords_old);
        body.coords_old.copy(body.coords);
    }

    getHand(index) {
        return this.handsData[index];
    }

    getBody() {
        return this.bodyData;
    }
}

export default new Tracking();
