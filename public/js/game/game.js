import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import CannonDebugger from 'cannon-es-debugger'

import { Board } from './Board.js';

import { loadFont } from '../utils/AssetLoader.js';

import {
    loadAudioBuffer
} from '../utils/AssetLoader.js';

function init() {
    let globalContext = {};

    globalContext.canvas = document.getElementById('gameCanvas');
    globalContext.canvas.width = window.innerWidth;
    globalContext.canvas.height = window.innerHeight;

    loadFont(globalContext)
        .then(() => loadAudioBuffer(globalContext, 'sounds/game_end.mp3'))
        .then(() => loadAudioBuffer(globalContext, 'sounds/game_start.mp3'))
        .then(() => loadAudioBuffer(globalContext, 'sounds/goal.mp3'))
        .then(() => loadAudioBuffer(globalContext, 'sounds/puck_hit.mp3'))
        .then(createScene)
        .then(createWorld)
        .then(createDebugRenderer)
        .then(addLightsToScene)
        .then(createCamera)
        .then(initListener)
        .then(() => createAudio(globalContext, "game_end"))
        .then(() => createAudio(globalContext, "game_start"))
        .then(() => createAudio(globalContext, "goal"))
        .then(() => createAudio(globalContext, "puck_hit"))
        .then(createRenderer)
        .then(createBoard)
        .then(addEventListeners)
        .then(draw)
        .catch(err => {
            console.log(err);
        });
}

async function createScene(globalContext) {
    const scene = new THREE.Scene();
    scene.add(new THREE.AxesHelper(100));
    
    globalContext.scene = scene;

    return globalContext;
}

function createWorld(globalContext) {
    const world = new CANNON.World();
    world.defaultContactMaterial.contactEquationStiffness = 1e6;
    world.defaultContactMaterial.contactEquationRelaxation = 10;
    world.defaultContactMaterial.restitution = 1;
    world.defaultContactMaterial.friction = 0.0;

    globalContext.world = world;

    return globalContext;
}

function createDebugRenderer(globalContext) {
    const {
        world,
        scene
    } = globalContext;

    const cannonDebugger = new CannonDebugger(scene, world);

    globalContext.cannonDebugger = cannonDebugger;

    return globalContext;
}

function addLightsToScene(globalContext) {
    const {
        scene
    } = globalContext;

    scene.add(new THREE.AmbientLight(0x404040, 10));

    return globalContext;
}

function initListener(globalContext) {

    const listener = new THREE.AudioListener();
    listener.setMasterVolume(0.05);

    globalContext.listener = listener;

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

    camera.position.set(-400, 0, 300);
    camera.setRotationFromEuler(new THREE.Euler(-50 * Math.PI / 180, 90 * Math.PI / 180, 0, 'XYZ'));
    camera.up = new THREE.Vector3(0, 0, 1);
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    scene.add(camera);

    globalContext.camera = camera;

    return globalContext;
}

async function createAudio(globalContext, audioTitle) {
    const audioBuffer = globalContext[audioTitle];

    globalContext.camera.add(globalContext.listener);

    const sound = new THREE.Audio(globalContext.listener);

    sound.setBuffer(audioBuffer);
    sound.setLoop(false);
    sound.setVolume(1);

    globalContext[audioTitle] = sound;

    return globalContext;
}

function createRenderer(globalContext) {
    const {
        canvas
    } = globalContext;

    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);

    renderer.shadowMap.enabled = true;

    canvas.appendChild(renderer.domElement);

    globalContext.renderer = renderer;

    return globalContext;
}

function createBoard(globalContext) {
    const {
        scene,
        world,
        font
    } = globalContext;

    const board = new Board(globalContext);
    board.addToAll(scene, world);

    globalContext.board = board;

    return globalContext;
}

function addEventListeners(globalContext) {
    window.addEventListener('resize', onWindowResize(globalContext));

    return globalContext;
}

function onWindowResize(globalContext) {
    const {
        canvas,
        camera,
        renderer
    } = globalContext;

    return () => {
        camera.aspect = canvas.clientWidth / canvas.clientHeight;

        camera.updateProjectionMatrix();

        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    }
}

function draw(globalContext) {
    const {
        camera,
        scene,
        renderer,
        world,
        cannonDebugger,
        board
    } = globalContext;

    function render() {

        board.update();
        
        world.step(1);

        board.sync();

        if (cannonDebugger) cannonDebugger.update();

        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }

    render();
}

export function setup() {
    init();
}

/*function initOld() {
    var tableMaterial =
        new THREE.MeshLambertMaterial({
            color: 0x111111
        });

    var groundMaterial =
        new THREE.MeshLambertMaterial({
            color: 0x888888
        });

    var threeTable = new THREE.Mesh(
        new THREE.BoxGeometry(
            planeHeight * 1.05,
            planeWidth * 1.03,
            100,
            planeQuality,
            planeQuality,
            1),
        tableMaterial);
    threeTable.receiveShadow = true;
    threeTable.name = "table";

    var cannonTable = new CANNON.Body({
        mass: 0,
        position: new CANNON.Vec3(0, 0, -51),
        shape: new CANNON.Box(new CANNON.Vec3(planeHeight * 1.05 / 2, planeWidth * 1.03 / 2, 100 / 2)),
        material: new CANNON.Material()
    });

    var table = new GameObject(threeTable, cannonTable);
    table.addToScene(scene);
    table.addToWorld(world);

    var ground = new THREE.Mesh(
        new THREE.BoxGeometry(
            1000,
            1000,
            3,
            1,
            1,
            1),
        groundMaterial);

    ground.position.z = -132;
    ground.receiveShadow = true;
    ground.name = "ground";
    scene.add(ground);
}*/