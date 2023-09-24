import * as THREE from '../vendor/three.module.min.js';

import {
    GUI
} from '../vendor/lil-gui.module.min.js';
import {
    setup
} from '../game/game.js'

import {
    CustomScene
} from '../utils/CustomScene.js';

import {
    TextBox,
    toggleBevelEnabled
} from './TextBox.js';

import {
    loadFont,
    loadAudioBuffer
} from '../utils/AssetLoader.js';

let pointerDown = false;
let targetRotation = 0;
let targetRotationOnPointerDown = 0;
let pointerXOnPointerDown = 0;

document.getElementById("closeOptions").addEventListener("click", () => {
    document.getElementById("options").close();
});

document.getElementById("closeCredits").addEventListener("click", () => {
    document.getElementById("credits").close();
});

window.onload = init;

function init() {
    let globalContext = {};

    globalContext.canvas = document.getElementById('menuCanvas');
    globalContext.canvas.width = window.innerWidth;
    globalContext.canvas.height = window.innerHeight;

    globalContext.options = document.getElementById('options');
    globalContext.credits = document.getElementById('credits');

    globalContext.menuContainer = document.getElementById('menuContainer');

    globalContext.optionOpen = false;
    globalContext.creditsOpen = false;

    loadFont(globalContext)
        .then(() => loadAudioBuffer(globalContext, "sounds/BOX_15.mp3"))
        .then(createScene)
        .then(addLightsToScene)
        .then(createCamera)
        .then(() => createAudio(globalContext, "BOX_15"))
        .then(createText)
        .then(createGUI)
        .then(addEventListeners)
        .then(draw)
        .catch(err => {
            console.log(err);
        });
}

function createScene(globalContext) {
    //const scene = new THREE.Scene();

    const scene = new CustomScene({
        canvas: globalContext.canvas
    });

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

    const pointLight = new THREE.PointLight(0xffffff, 4.5, 0, 0);
    pointLight.color.setHSL(Math.random(), 1, 0.5);
    pointLight.position.set(0, 100, 90);
    scene.add(pointLight);

    globalContext.pointLight = pointLight;

    return globalContext;
}

function createCamera(globalContext) {
    const {
        canvas,
        scene
    } = globalContext;

    const camera = new THREE.PerspectiveCamera(35, canvas.clientWidth / canvas.clientHeight, 0.1, 2000);
    camera.position.set(0, 0, 800);
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    scene.setCamera(camera);

    return globalContext;
}

async function createAudio(globalContext, audioTitle) {
    const audioBuffer = globalContext[audioTitle];

    globalContext.listener = globalContext.scene.getListener();

    const sound = new THREE.Audio(globalContext.listener);

    globalContext.sound = sound;

    sound.setBuffer(audioBuffer);
    sound.setLoop(true);
    sound.setVolume(1);

    return globalContext;
}

function createText(globalContext) {
    const {
        scene,
        font
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
        text: 'Options',
        font,
        material: materials
    });

    optionTextBox.position.set(0, -50, 0);

    group.add(optionTextBox);

    const creditsTextBox = new TextBox({
        name: 'credits',
        text: 'Credits',
        font,
        material: materials
    });

    creditsTextBox.position.set(0, -150, 0);

    group.add(creditsTextBox);

    scene.add(group);

    return globalContext;
}

function createGUI(globalContext) {
    const {
        listener,
        sound,
        pointLight
    } = globalContext;

    const textControls = {
        changeColor: function () {
            pointLight.color.setHSL(Math.random(), 1, 0.5);
        },
        changeBevel: function () {
            toggleBevelEnabled();
            refreshText(globalContext)
        }
    };

    const soundControls = {
        master: listener.getMasterVolume(),
        playPause: false
    }

    const gui = new GUI();
    const textFolder = gui.addFolder('Text');
    //const volumeFolder = gui.addFolder('Volume');

    textFolder.add(textControls, 'changeBevel').name('change bevel');
    textFolder.add(textControls, 'changeColor').name('change color');

    /*volumeFolder.add(soundControls, 'master')
        .min(0.0)
        .max(0.4)
        .step(0.01)
        .onChange(() => {
            listener.setMasterVolume(soundControls.master);
        });

    volumeFolder.add(soundControls, 'playPause')
        .onChange(() => {
            if (soundControls.playPause) {
                sound.play();
            } else {
                sound.pause();
            }
        });*/

    globalContext.gui = gui;

    return globalContext;
}

function addEventListeners(globalContext) {
    const {
        canvas,
        sound,
        scene
    } = globalContext;

    canvas.style.touchAction = 'none';
    canvas.addEventListener('pointerdown', onPointerDown(globalContext));
    canvas.addEventListener('pointermove', onPointerMove(globalContext));
    canvas.addEventListener('pointerup', onPointerUp(globalContext));

    document.getElementById('volume').addEventListener('input', (event) => {
        const volume = event.target.value / 100;
        scene.setMasterVolume(volume);
    })

    document.getElementById('audioOnOff').addEventListener('input', (event) => {
        if (event.target.checked) {
            sound.play();
        } else {
            sound.pause();
        }
    })

    return globalContext;
}

function onPointerDown(globalContext) {
    const {
        canvas,
    } = globalContext;

    return (event) => {
        if (event.isPrimary === false) return;

        pointerDown = true;

        pointerXOnPointerDown = event.clientX - canvas.clientWidth / 2;
        targetRotationOnPointerDown = targetRotation;
    }
}

function onPointerMove(globalContext) {
    const {
        canvas
    } = globalContext;

    return (event) => {
        if (event.isPrimary === false) return;

        if (pointerDown === true) {
            let pointerX = event.clientX - canvas.clientWidth / 2;
            targetRotation = targetRotationOnPointerDown + (pointerX - pointerXOnPointerDown) * 0.02;
        } else {
            //set the target to the closent "0" degrees
            targetRotation = Math.round(targetRotation / (2 * Math.PI)) * (2 * Math.PI);
        }
    }
}

function onPointerUp(globalContext) {
    let {
        scene,
        gui,
        options,
        optionOpen,
        credits,
        creditsOpen
    } = globalContext;

    return (event) => {
        if (event.isPrimary === false) return;

        pointerDown = false;

        const intersectes = scene.getIntersects();

        if (intersectes.length !== 0) {
            const firstIntersect = intersectes[0].object.parent;

            switch (firstIntersect.name) {
                case 'start':
                    // Hide the menu
                    menuContainer.style.display = 'none';

                    scene.stopAnimationLoop();

                    // Start the game
                    document.getElementById('gameContainer').style.display = 'flex';
                    setup(scene);

                    // Close the GUI
                    gui.hide()
                    break;
                case 'options':
                    // Close the credits if it's open
                    if (creditsOpen) {
                        creditsOpen = false;
                        credits.close();
                    }

                    options.open ? options.close() : options.showModal();

                    break;
                case 'credits':
                    // Close the options if it's open
                    if (optionOpen) {
                        optionOpen = false;
                        options.close();
                    }

                    credits.open ? credits.close() : credits.showModal();
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

function draw(globalContext) {
    const {
        scene
    } = globalContext;

    scene.startAnimationLoop(() => {
        hoverButton(globalContext);

        scene.getObjectByName("textGroup").rotation.y += (targetRotation - scene.getObjectByName("textGroup").rotation.y) * 0.05;
    });
}

function hoverButton(globalContext) {
    const {
        scene
    } = globalContext;

    const intersectes = scene.getIntersects();

    if (intersectes.length === 0) {
        scene.getObjectByName("textGroup").children.filter(x => x.name !== 'title').forEach(child => {
            child.scale.set(1, 1, 1)
        })
    } else {
        intersectes[0].object.parent.scale.set(1.1, 1.1, 1.1);
    }
}