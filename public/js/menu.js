import * as THREE from 'three';
import {
    GUI
} from 'three/addons/libs/lil-gui.module.min.js';
import {
    setup
} from './game.js'

import {
    TextBox,
    toggleBevelEnabled,
    loadFont,
} from './utils.js';

let pointerDown = false;
let targetRotation = 0;
let targetRotationOnPointerDown = 0;
let pointerXOnPointerDown = 0;
let pointLight;

document.getElementById("closeOptions").addEventListener("click", () => {
    document.getElementById("options").close();
});

document.getElementById("closeCredits").addEventListener("click", () => {
    document.getElementById("credits").close();
});

init();

function init() {
    let globalContext = {};

    globalContext.menuCanvas = document.getElementById('menuCanvas');
    globalContext.menuCanvas.width = window.innerWidth;
    globalContext.menuCanvas.height = window.innerHeight;

    globalContext.options = document.getElementById('options');
    globalContext.credits = document.getElementById('credits');

    globalContext.menuContainer = document.getElementById('menuContainer');

    globalContext.raycaster = new THREE.Raycaster();
    globalContext.mouse = new THREE.Vector2(1, 1);

    globalContext.optionText = 'Options';
    globalContext.optionOpen = false;
    globalContext.creditsText = 'Credits';
    globalContext.creditsOpen = false;

    loadFont(globalContext)
        .then(createScene)
        .then(addLightsToScene)
        .then(createCamera)
        .then(loadAudio)
        .then(createText)
        .then(createRenderer)
        .then(createGUI)
        .then(addEventListeners)
        .then(globalContext => {
            console.log(globalContext);
            return globalContext;
        })
        .then(animate)
        .catch(err => {
            console.log(err);
        });
}

function createScene(globalContext) {
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000000, 250, 1400);

    globalContext.scene = scene;

    return globalContext;
}

function addLightsToScene(globalContext) {
    const {
        scene
    } = globalContext;

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.4);
    dirLight.position.set(0, 0, 1).normalize();
    scene.add(dirLight);

    pointLight = new THREE.PointLight(0xffffff, 4.5, 0, 0);
    pointLight.color.setHSL(Math.random(), 1, 0.5);
    pointLight.position.set(0, 100, 90);
    scene.add(pointLight);

    globalContext.pointLight = pointLight;

    return globalContext;
}

function createCamera(globalContext) {
    const {
        menuCanvas
    } = globalContext;

    const camera = new THREE.PerspectiveCamera(35, menuCanvas.clientWidth / menuCanvas.clientHeight, 0.1, 2000);
    camera.position.set(0, 0, 800);
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    globalContext.camera = camera;

    return globalContext;
}

async function loadAudio(globalContext) {
    const listener = new THREE.AudioListener();
    listener.setMasterVolume(0);

    globalContext.listener = listener;

    globalContext.camera.add(listener);

    const sound = new THREE.Audio(listener);

    globalContext.sound = sound;

    if (false) {
        const songElement = document.getElementById('song')
        sound.setMediaElementSource(songElement);
        sound.hasPlaybackControl = true;
        sound.setFilter(listener.context.createWaveShaper());
        sound.setLoop(true);
        sound.setVolume(0);
        songElement.play()
            .catch((error) => {
                if (error.name === "NotAllowedError") {
                    console.log("Autoplay is not allowed.")
                }
            });
    } else {
        const buffer = await new THREE.AudioLoader()
            .loadAsync('../sounds/BOX_15.mp3');

        sound.setBuffer(buffer);
        sound.setLoop(true);
        sound.setVolume(0.1);
        sound.play();
    }

    return globalContext;
}

function createText(globalContext) {
    const {
        scene,
        font,
        optionText,
        creditsText
    } = globalContext;

    let materials = [
        new THREE.MeshPhongMaterial({
            color: 0xffffff,
            flatShading: true
        }), // front
        new THREE.MeshPhongMaterial({
            color: 0xffffff
        }) // side
    ];

    let group = new THREE.Group();
    group.name = "textGroup"

    const titleTextBox = new TextBox({
        name: 'title',
        text: 'Air Hockey 3D',
        font,
        material: materials,
        size: 50
    });

    titleTextBox.position.set(0, 175, 0);

    group.add(titleTextBox);

    const startTextBox = new TextBox({
        name: 'start',
        text: 'Start game',
        font,
        material: materials
    });

    startTextBox.position.set(0, 50, 0);

    group.add(startTextBox);

    const optionTextBox = new TextBox({
        name: 'options',
        text: optionText,
        font,
        material: materials
    });

    optionTextBox.position.set(0, -50, 0);

    group.add(optionTextBox);

    const creditsTextBox = new TextBox({
        name: 'credits',
        text: creditsText,
        font,
        material: materials
    });

    creditsTextBox.position.set(0, -150, 0);

    group.add(creditsTextBox);

    scene.add(group);

    return globalContext;
}

function createRenderer(globalContext) {
    const {
        menuCanvas
    } = globalContext;

    let renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    }); // alpha turn background transparent
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(menuCanvas.clientWidth, menuCanvas.clientHeight);
    menuCanvas.appendChild(renderer.domElement);

    globalContext.renderer = renderer;

    return globalContext;
}

function createGUI(globalContext) {
    const {
        listener,
        pointLight
    } = globalContext;

    const params = {
        changeColor: function () {
            pointLight.color.setHSL(Math.random(), 1, 0.5);
        },
        changeBevel: function () {
            toggleBevelEnabled();
            refreshText(globalContext)
        }
    };

    const SoundControls = function () {
        this.master = listener.getMasterVolume();
    };

    const gui = new GUI();
    const textFolder = gui.addFolder('Text');
    const volumeFolder = gui.addFolder('Volume');

    const soundControls = new SoundControls();

    textFolder.add(params, 'changeBevel').name('change bevel');
    textFolder.add(params, 'changeColor').name('change color');

    volumeFolder.add(soundControls, 'master')
        .min(0.0)
        .max(1.0)
        .step(0.01)
        .onChange(() => {
            listener.setMasterVolume(soundControls.master);
        });

    globalContext.gui = gui;

    return globalContext;
}

function addEventListeners(globalContext) {
    const {
        menuCanvas,
        sound,
        listener
    } = globalContext;

    menuCanvas.style.touchAction = 'none';
    window.addEventListener('resize', onWindowResize(globalContext));
    menuCanvas.addEventListener('mousemove', onMouseMove(globalContext));
    menuCanvas.addEventListener('pointerdown', onPointerDown(globalContext));
    menuCanvas.addEventListener('pointermove', onPointerMove(globalContext));
    menuCanvas.addEventListener('pointerup', onPointerUp(globalContext));

    document.getElementById('volume').addEventListener('input', (event) => {
        console.log(event)
        const volume = event.target.value / 100;
        console.log(volume)
        sound.setVolume(volume);
        listener.setMasterVolume(volume);
    })

    return globalContext;
}

function onWindowResize(globalContext) {
    const {
        menuCanvas,
        camera,
        renderer
    } = globalContext;

    return () => {
        camera.aspect = menuCanvas.clientWidth / menuCanvas.clientHeight;

        camera.updateProjectionMatrix();

        renderer.setSize(menuCanvas.clientWidth, menuCanvas.clientHeight);
    }
}

function onMouseMove(globalContext) {
    const {
        menuCanvas,
        renderer,
        mouse
    } = globalContext;

    // Calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components

    return (event) => {
        const rect = renderer.domElement.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        mouse.x = (x / menuCanvas.clientWidth) * 2 - 1;
        mouse.y = -(y / menuCanvas.clientHeight) * 2 + 1;
    }
}

function onPointerDown(globalContext) {
    const {
        menuCanvas,
    } = globalContext;

    console.log('onPointerDown:');

    return (event) => {
        if (event.isPrimary === false) return;

        pointerDown = true;

        pointerXOnPointerDown = event.clientX - menuCanvas.clientWidth / 2;
        targetRotationOnPointerDown = targetRotation;
    }
}

function onPointerMove(globalContext) {
    const {
        menuCanvas
    } = globalContext;

    console.log('onPointerMove');

    return (event) => {
        if (event.isPrimary === false) return;

        if (pointerDown === true) {
            let pointerX = event.clientX - menuCanvas.clientWidth / 2;
            targetRotation = targetRotationOnPointerDown + (pointerX - pointerXOnPointerDown) * 0.02;
        } else {
            //set the target to the closent "0" degrees
            targetRotation = Math.round(targetRotation / (2 * Math.PI)) * (2 * Math.PI);
        }
    }
}

function onPointerUp(globalContext) {
    let {
        camera,
        scene,
        raycaster,
        mouse,
        gui,
        options,
        optionOpen,
        credits,
        creditsOpen
    } = globalContext;

    console.log('onPointerUp');

    return (event) => {
        if (event.isPrimary === false) return;

        pointerDown = false;

        raycaster.setFromCamera(mouse, camera)
        const intersectes = raycaster.intersectObjects(scene.children);

        if (intersectes.length !== 0) {
            const firstIntersect = intersectes[0].object.parent;

            switch (firstIntersect.name) {
                case 'start':
                    // Hide the menu
                    menuContainer.style.display = 'none';

                    mouse = new THREE.Vector2(1, 1);

                    // Start the game
                    document.getElementById('gameContainer').style.display = 'flex';
                    setup();

                    // Close the GUI
                    gui.hide()

                    console.log('start game')
                    break;
                case 'options':
                    // Close the credits if it's open
                    if (creditsOpen) {
                        creditsOpen = false;
                        credits.close();

                        // Reset option text
                        //globalContext.creditsText = 'Credits';
                    }

                    // If it's already open, close it
                    if (optionOpen) {
                        optionOpen = false;
                        options.close();

                        // Reset option text
                        //globalContext.optionText = 'Options';
                        //refreshText(globalContext)
                        return;
                    }

                    optionOpen = true;

                    options.showModal();

                    // Change Option text to close
                    //globalContext.optionText = 'Close Options';

                    //refreshText(globalContext)
                    break;
                case 'credits':
                    // Close the options if it's open
                    if (optionOpen) {
                        optionOpen = false;
                        options.close();

                        // Reset option text
                        //globalContext.optionText = 'Options';
                    }

                    // If it's already open, close it
                    if (creditsOpen) {
                        creditsOpen = false;
                        credits.close();

                        // Reset option text
                        //globalContext.creditsText = 'Credits';
                        //refreshText(globalContext)
                        return;
                    }

                    creditsOpen = true;

                    credits.showModal();

                    // Change Option text to close
                    //globalContext.creditsText = 'Close Credits';
                    //refreshText(globalContext)
                    break;
                default:
                    break;
            }
        }
    }
}

function refreshText(globalContext) {
    const {
        scene
    } = globalContext;

    scene.getObjectByName("textGroup").removeFromParent();

    createText(globalContext);
}

function animate(globalContext) {
    const {
        camera,
        scene,
        renderer,
        mouse
    } = globalContext;

    function render() {
        hoverButton(globalContext);
        requestAnimationFrame(render);

        //move text based on mouse position
        //scene.getObjectByName("textGroup").rotation.x = -mouse.y;
        //scene.getObjectByName("textGroup").rotation.y = mouse.x;

        scene.getObjectByName("textGroup").rotation.y += (targetRotation - scene.getObjectByName("textGroup").rotation.y) * 0.05;

        renderer.clear();
        renderer.render(scene, camera);
    }

    render(globalContext);
}

function hoverButton(globalContext) {
    const {
        camera,
        scene,
        raycaster,
        mouse
    } = globalContext;

    raycaster.setFromCamera(mouse, camera);

    const intersectes = raycaster.intersectObjects(scene.children);

    if (intersectes.length === 0) {
        scene.getObjectByName("textGroup").children.filter(x => x.name !== 'title').forEach(child => {
            child.scale.set(1, 1, 1)
        })
    } else {
        intersectes[0].object.parent.scale.set(1.1, 1.1, 1.1);
    }
}