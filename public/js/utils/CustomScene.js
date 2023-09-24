import * as THREE from '../vendor/three.module.min.js';

export class CustomScene extends THREE.Scene {
    #animationLoopFunction;
    #camera;
    #listener;
    #mousePosition;
    #raycaster;
    #renderer;
    #world;

    constructor({
        canvas
    }) {
        super();

        if (canvas) {
            this.creteRenderer(canvas);
        }

        this.#mousePosition = new THREE.Vector2();
        this.#raycaster = new THREE.Raycaster();

        window.addEventListener('resize', this.#resizeToCanvasSize.bind(this));
        canvas.addEventListener('mousemove', this.#onMouseMove.bind(this));
    }

    creteRenderer(canvas) {
        this.#renderer = new THREE.WebGLRenderer({
            //canvas: canvas,
            antialias: true,
            alpha: true
        });

        this.#renderer.shadowMap.enabled = true;
        this.#renderer.setPixelRatio(window.devicePixelRatio);
        this.#renderer.setSize(canvas.clientWidth, canvas.clientHeight);

        canvas.appendChild(this.#renderer.domElement);

        return this;
    }

    setCamera(camera) {
        this.#camera = camera;

        this.#listener = new THREE.AudioListener();
        this.#listener.setMasterVolume(0.05);
        this.#camera.add(this.#listener);

        this.add(this.#camera);

        return this;
    }

    setWorld(world) {
        this.#world = world;
        return this;
    }

    getWorld() {
        return this.#world;
    }

    setMasterVolume(volume) {
        this.#listener.setMasterVolume(volume);

        return this;
    }

    #resizeToCanvasSize() {
        const canvas = this.#renderer.domElement;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        this.#renderer.setSize(width, height);

        if (this.#camera) {
            this.#camera.aspect = width / height;
            this.#camera.updateProjectionMatrix();
        }
    }
    
    #onMouseMove(event) {
        const rect = this.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        this.#mousePosition.x = (x / this.#renderer.domElement.clientWidth) * 2 - 1;
        this.#mousePosition.y = -(y / this.#renderer.domElement.clientHeight) * 2 + 1;
    }

    getListener() {
        return this.#listener;
    }

    getBoundingClientRect() {
        return this.#renderer.domElement.getBoundingClientRect();
    }

    getIntersects() {
        this.#raycaster.setFromCamera(this.#mousePosition, this.#camera);
        return this.#raycaster.intersectObjects(this.children);
    }

    setAnimationLoop(callback) {
        this.#animationLoopFunction = callback;
        return this;
    }

    startAnimationLoop(callback) {
        if (callback) this.#animationLoopFunction = callback;

        this.#renderer.setAnimationLoop(() => {
            this.#animationLoopFunction();

            if (this.cannonDebugger) this.cannonDebugger.update();

            this.#renderer.render(this, this.#camera);
        });
    }
    
    stopAnimationLoop() {
        this.#renderer.setAnimationLoop(null);
    }
}