import * as THREE from 'three';
import {
    FontLoader
} from 'three/addons/loaders/FontLoader.js';
import {
    TextGeometry
} from 'three/addons/geometries/TextGeometry.js';
import {
    GUI
} from 'three/addons/libs/lil-gui.module.min.js';
import {
    setup
} from './game.js'

let bevelEnabled = true;
let pointerDown = false;
let targetRotation = 0;
let targetRotationOnPointerDown = 0;
let pointerXOnPointerDown = 0;

init();

class Text extends TextGeometry {
    constructor({
        text,
        font
    }) {
        const size = 30,
            height = 10,
            curveSegments = 4,
            bevelThickness = 1,
            bevelSize = 1.5;
        super(text, {
            font,
            size,
            height,
            curveSegments,
            bevelThickness,
            bevelSize,
            bevelEnabled
        });
    }
}

class TextBox extends THREE.Group {
    isOpen = false;
    constructor({
        name,
        text,
        font,
        material
    }) {
        super();

        let textMesh = new THREE.Mesh(
            new Text({
                text,
                font
            }),
            material
        );

        textMesh.name = 'text';

        //center text mesh
        textMesh.geometry.computeBoundingBox();
        textMesh.position.set(
            -0.5 * (textMesh.geometry.boundingBox.max.x - textMesh.geometry.boundingBox.min.x),
            -0.5 * (textMesh.geometry.boundingBox.max.y - textMesh.geometry.boundingBox.min.y),
            -0.5 * (textMesh.geometry.boundingBox.max.z - textMesh.geometry.boundingBox.min.z)
        );

        this.add(textMesh);

        let textBox3 = new THREE.Box3()
            .setFromObject(textMesh);

        let textBox = new THREE.Mesh(
            new THREE.BoxGeometry(
                textBox3.max.x - textBox3.min.x,
                textBox3.max.y - textBox3.min.y,
                textBox3.max.z - textBox3.min.z
            ),
            new THREE.MeshBasicMaterial({
                color: 0x00ff00,
                transparent: true,
                opacity: 0
            })
        )

        textBox.name = 'box';

        //textBox.position.set(textMesh.position.x, textMesh.position.y, textMesh.position.z)

        this.add(textBox);

        this.name = name;
    }
}


function init() {
    let globalContext = {};

    globalContext.container = document.getElementById('menuCanvas');
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

async function loadFont(globalContext) {
    const font = await new FontLoader()
        .loadAsync('../fonts/Nunito.json')

    globalContext.font = font;

    return globalContext;
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

    const pointLight = new THREE.PointLight(0xffffff, 4.5, 0, 0);
    pointLight.color.setHSL(Math.random(), 1, 0.5);
    pointLight.position.set(0, 100, 90);
    scene.add(pointLight);

    return globalContext;
}

function createCamera(globalContext) {
    const {
        container
    } = globalContext;

    const camera = new THREE.PerspectiveCamera(35, container.clientWidth / container.clientHeight, 0.1, 2000);
    camera.position.set(0, 0, 500);
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    globalContext.camera = camera;

    return globalContext;
}

async function loadAudio(globalContext) {
    const listener = new THREE.AudioListener();
    listener.setMasterVolume(0.3);

    globalContext.listener = listener;

    globalContext.camera.add(listener);

    const sound = new THREE.Audio(listener);

    globalContext.sound = sound;

    /*const songElement = document.getElementById('song')
    sound.setMediaElementSource(songElement);
    sound.hasPlaybackControl = true;
    sound.setFilter(listener.context.createWaveShaper());
    sound.setLoop(true);
    sound.setVolume(0.1);
    songElement.play();*/

    const buffer = await new THREE.AudioLoader()
        .loadAsync('../sounds/BOX_15.mp3');

    sound.setBuffer(buffer);
    sound.setLoop(true);
    sound.setVolume(0.1);
    sound.play();

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

    const startTextBox = new TextBox({
        name: 'start',
        text: 'Start game',
        font,
        material: materials
    });

    startTextBox.position.set(0, 100, 0);

    group.add(startTextBox);

    const optionTextBox = new TextBox({
        name: 'option',
        text: optionText,
        font,
        material: materials
    });

    group.add(optionTextBox);

    const creditsTextBox = new TextBox({
        name: 'credits',
        text: creditsText,
        font,
        material: materials
    });

    creditsTextBox.position.set(0, -100, 0);

    group.add(creditsTextBox);

    scene.add(group);

    return globalContext;
}

function createRenderer(globalContext) {
    const {
        container
    } = globalContext;

    let renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    }); // alpha turn background transparent
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    globalContext.renderer = renderer;

    return globalContext;
}

function createGUI(globalContext) {
    const {
        listener
    } = globalContext;

    const params = {
        changeColor: function () {
            pointLight.color.setHSL(Math.random(), 1, 0.5);
        },
        changeBevel: function () {
            bevelEnabled = !bevelEnabled;
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
        container,
        sound,
        listener
    } = globalContext;

    container.style.touchAction = 'none';
    window.addEventListener('resize', onWindowResize(globalContext));
    container.addEventListener('mousemove', onMouseMove(globalContext));
    container.addEventListener('pointerdown', onPointerDown(globalContext));
    document.addEventListener('pointermove', onPointerMove(globalContext));
    document.addEventListener('pointerup', onPointerUp(globalContext));

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
        container,
        camera,
        renderer
    } = globalContext;

    return () => {
        camera.aspect = container.clientWidth / container.clientHeight;

        camera.updateProjectionMatrix();

        renderer.setSize(container.clientWidth, container.clientHeight);
    }
}

function onMouseMove(globalContext) {
    const {
        container,
        renderer,
        mouse
    } = globalContext;

    // Calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components

    return (event) => {
        const rect = renderer.domElement.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        mouse.x = (x / container.clientWidth) * 2 - 1;
        mouse.y = -(y / container.clientHeight) * 2 + 1;
    }
}

function onPointerDown(globalContext) {
    const {
        container,
    } = globalContext;

    console.log('onPointerDown:');

    return (event) => {
        if (event.isPrimary === false) return;

        pointerDown = true;

        pointerXOnPointerDown = event.clientX - container.clientWidth / 2;
        targetRotationOnPointerDown = targetRotation;
    }
}

function onPointerMove(globalContext) {
    const {
        container
    } = globalContext;

    console.log('onPointerMove');

    return (event) => {
        if (event.isPrimary === false) return;

        if (pointerDown === true) {
            let pointerX = event.clientX - container.clientWidth / 2;
            targetRotation = targetRotationOnPointerDown + (pointerX - pointerXOnPointerDown) * 0.02;
        } else {
            targetRotation = 0;
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

        //document.removeEventListener('pointermove', onPointerMove(globalContext));
        //document.removeEventListener('pointerup', onPointerUp(globalContext));

        pointerDown = false;

        // raycaster check intersection
        raycaster.setFromCamera(mouse, camera)
        const intersectes = raycaster.intersectObjects(scene.children);

        // Get the heights of the footers
        const optionHeight = options.clientHeight;
        const creditsHeight = credits.clientHeight;

        if (intersectes.length !== 0) {
            const firstIntersect = intersectes[0].object.parent;

            console.log(firstIntersect.name);
            console.log(optionOpen);
            console.log(creditsOpen);

            switch (firstIntersect.name) {
                case 'start':
                    // Hide the menu
                    menuContainer.style.display = 'none';

                    mouse = new THREE.Vector2(1, 1);

                    // Start the game
                    document.getElementById('gameContainer').style.display = 'block';
                    setup();

                    // Close the GUI
                    gui.hide()

                    console.log('start game')
                    break;
                case 'option':
                    // Close the credits if it's open
                    //if (credits.style.bottom == `0px`) {
                    if (creditsOpen) {
                        creditsOpen = false;
                        credits.style.bottom = `-${creditsHeight}px`;
                        document.body.style.marginBottom = `0px`;

                        // Reset option text
                        globalContext.creditsText = 'Credits';
                    }

                    // If it's already open, close it
                    //if (options.style.bottom == `0px`) {
                    if (optionOpen) {
                        optionOpen = false;
                        options.style.bottom = `-${optionHeight}px`;
                        document.body.style.marginBottom = `0px`;

                        // Reset option text
                        globalContext.optionText = 'Options';
                        refreshText(globalContext)
                        return;
                    }

                    optionOpen = true;

                    options.style.bottom = `0px`;

                    // Scroll the content to make the footer visible
                    document.body.style.marginBottom = `${optionHeight}px`;

                    // Change Option text to close
                    globalContext.optionText = 'Close Options';

                    refreshText(globalContext)
                    break;
                case 'credits':
                    // Close the options if it's open
                    //if (options.style.bottom == `0px`) {
                    if (optionOpen) {
                        optionOpen = false;
                        options.style.bottom = `-${optionHeight}px`;
                        document.body.style.marginBottom = `0px`;

                        // Reset option text
                        globalContext.optionText = 'Options';
                    }

                    // If it's already open, close it
                    //if (credits.style.bottom == `0px`) {
                    if (creditsOpen) {
                        creditsOpen = false;
                        credits.style.bottom = `-${creditsHeight}px`;
                        document.body.style.marginBottom = `0px`;

                        // Reset option text
                        globalContext.creditsText = 'Credits';
                        refreshText(globalContext)
                        return;
                    }

                    creditsOpen = true;

                    credits.style.bottom = `0px`;

                    // Scroll the content to make the footer visible
                    document.body.style.marginBottom = `${creditsHeight}px`;

                    // Change Option text to close
                    globalContext.creditsText = 'Close Credits';
                    refreshText(globalContext)
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
        //scene.getObjectByName("textGroup").rotation.y = (mouse.x - 170);
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
        //scene.children[2].children.forEach(child => {
        scene.getObjectByName("textGroup")?.children?.forEach(child => {
            child.scale.set(1, 1, 1)
        })
    } else {
        intersectes[0].object.parent.scale.set(1.1, 1.1, 1.1);
    }
}