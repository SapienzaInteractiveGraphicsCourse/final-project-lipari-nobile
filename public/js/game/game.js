import * as THREE from '../vendor/three.module.min.js';

import * as CANNON from '../vendor/cannon-es.js';

import {
    Board
} from './Board.js';

import {
    loadFont
} from '../utils/AssetLoader.js';

import {
    loadAudioBuffer
} from '../utils/AssetLoader.js';
import { CustomScene } from '../utils/CustomScene.js';

let running = true;

function init(menuScene) {
    let globalContext = {};

    globalContext.menuScene = menuScene;

    globalContext.canvas = document.getElementById('gameCanvas');
    globalContext.canvas.width = window.innerWidth;
    globalContext.canvas.height = window.innerHeight;

    loadFont(globalContext)
        .then(() => loadAudioBuffer(globalContext, './public/sounds/game_end.mp3'))
        .then(() => loadAudioBuffer(globalContext, './public/sounds/game_start.mp3'))
        .then(() => loadAudioBuffer(globalContext, './public/sounds/goal.mp3'))
        .then(() => loadAudioBuffer(globalContext, './public/sounds/puck_hit.mp3'))
        .then(createScene)
        .then(createWorld)
        .then(addLightsToScene)
        .then(createCamera)
        .then(() => createAudio(globalContext, "game_end"))
        .then(() => createAudio(globalContext, "game_start"))
        .then(() => createAudio(globalContext, "goal"))
        .then(() => createAudio(globalContext, "puck_hit"))
        .then(createBoard)
        .then(addEventListeners)
        .then(draw)
        .catch(err => {
            console.log(err);
        });
}

function createScene(globalContext) {
    const scene = new CustomScene({
        canvas: globalContext.canvas
    });

    globalContext.scene = scene;

    return globalContext;
}

function createWorld(globalContext) {
    const world = new CANNON.World();
    world.defaultContactMaterial.contactEquationStiffness = 1e6;
    world.defaultContactMaterial.contactEquationRelaxation = 10;
    world.defaultContactMaterial.restitution = 1;
    world.defaultContactMaterial.friction = 0.0;

    globalContext.scene.setWorld(world);

    return globalContext;
}

function addLightsToScene(globalContext) {
    const {
        scene
    } = globalContext;

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    let spotLight = new THREE.SpotLight(0xffffff, 4, 0, Math.PI / 4, 0.7, 0);
    spotLight.position.set(0, 0, 200);
    scene.add(spotLight);

    return globalContext;
}

function createCamera(globalContext) {
    const {
        canvas,
        scene
    } = globalContext;

    const camera =
        new THREE.PerspectiveCamera(
            50,
            canvas.clientWidth / canvas.clientHeight,
            0.1,
            10000);

    camera.position.set(-350, 0, 350);
    camera.setRotationFromEuler(new THREE.Euler(-50 * Math.PI / 180, 90 * Math.PI / 180, 0, 'XYZ'));
    camera.up = new THREE.Vector3(0, 0, 1);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    scene.setCamera(camera);

    return globalContext;
}

async function createAudio(globalContext, audioTitle) {
    const audioBuffer = globalContext[audioTitle];

    globalContext.listener = globalContext.scene.getListener();

    const sound = new THREE.Audio(globalContext.listener);

    sound.setBuffer(audioBuffer);
    sound.setLoop(false);
    sound.setVolume(1);

    if (audioTitle === "puck_hit") {
        sound.playbackRate = 2.5;
    }

    globalContext[audioTitle] = sound;

    return globalContext;
}

function createBoard(globalContext) {
    const {
        scene
    } = globalContext;

    const board = new Board(globalContext);
    board.addToAll(scene, scene.getWorld());

    globalContext.board = board;

    let groundTextue = new THREE.TextureLoader().load('./images/ash.jpg');
    groundTextue.wrapS = THREE.RepeatWrapping;
    groundTextue.wrapT = THREE.RepeatWrapping;
    groundTextue.repeat.set(5, 5);

    var ground = new THREE.Mesh(
        new THREE.BoxGeometry(
            1000,
            1000,
            3,
            1,
            1,
            1),
        new THREE.MeshPhongMaterial({
            map: groundTextue
        })
    );

    ground.position.z = -132;
    ground.receiveShadow = true;
    ground.name = "ground";
    scene.add(ground);

    return globalContext;
}

function addEventListeners(globalContext) {
    document.getElementById("settings").addEventListener('click', handleModal);
    document.getElementById('retry').addEventListener('click', handleRetry(globalContext));
    document.getElementById("main").addEventListener('click', handleMainMenu(globalContext));

    window.addEventListener('keydown', function (event) {
        // prevent escape character to exit the modal
        event.preventDefault();
        const modal = document.getElementById("options");
        if (event.key === "Escape") {
            modal.open ? modal.close() : modal.showModal();
            if (!running) {
                running = true;
                draw(globalContext);
            } else {
                running = false;
                //globalContext.renderer.setAnimationLoop(null);
                globalContext.scene.stopAnimationLoop();
            }
        }
    })

    return globalContext;
}

function draw(globalContext) {
    const {
        scene,
        board
    } = globalContext;

    scene.startAnimationLoop(() => {
        board.update();

        scene.getWorld().step(1);

        board.sync();
    });
}

export function setup(menuScene) {
    init(menuScene);
}

/* buttons handler */
function handleModal() {
    const modal = document.getElementById("options");
    modal.open ? modal.close() : modal.showModal();
}

function handleRetry(globalContext) {
    const {
        board
    } = globalContext;

    return () => {
        // restart the game
        board.resetBoard();
        const modal = document.getElementById("endgame");
        modal.close();
    }
}

function handleMainMenu(globalContext) {
    // go back to main menu
    const {
        scene,
        menuScene
    } = globalContext;

    return () => {
        const modal = document.getElementById("endgame");
        modal.close();

        const canvas = document.getElementById("gameContainer");
        canvas.style.display = "none"

        document.getElementById('gameCanvas').removeChild(document.getElementById('gameCanvas').firstElementChild)

        //clone and replace to remove all event listeners
        document.getElementById("endgame").parentNode.replaceChild(document.getElementById("endgame").cloneNode(true), document.getElementById("endgame"));

        const menu = document.getElementById("menuContainer");
        menu.style.display = "flex";

        scene.stopAnimationLoop();

        menuScene.startAnimationLoop();
    }
}