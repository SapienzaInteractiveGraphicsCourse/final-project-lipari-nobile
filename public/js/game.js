import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import CannonDebugger from 'cannon-es-debugger'

import Key from './keyboard.js';

// Call this method when the game starts 
//window.addEventListener('load', () => setup(), false);

const WIDTH = 640;
const HEIGHT = 360;

// scene object variables
var world;
var renderer, scene, camera;
var cannonDebugger;
var ball, paddle1, paddle2;

// field variables
var fieldWidth = 400,
    fieldHeight = 200;

// paddle variables
var paddleSpeed = 3;

// game-related variables
var score1 = 0,
    score2 = 0,
    maxScore = 7;

// set opponent difficulty (0 - easiest, 1 - hardest)
var difficulty = 0.08;

//a class that fuses the three.js and cannon.js objects
class GameObject {
    constructor(threeObject, cannonObject) {
        this.threeObject = threeObject;
        this.cannonObject = cannonObject;
        this.sync();
    }

    sync() {
        this.threeObject.position.copy(this.cannonObject.position);
        this.threeObject.quaternion.copy(this.cannonObject.quaternion);
    }

    addToScene(scene) {
        scene.add(this.threeObject);
    }

    addToWorld(world) {
        world.addBody(this.cannonObject);
    }

    addToAll(scene, world) {
        this.addToScene(scene);
        this.addToWorld(world);
    }
}

export function setup() {
    document.getElementById("winnerBoard").innerHTML = "First to " + maxScore + " wins!";

    init();

    draw();
}

function createScene() {
    scene = new THREE.Scene();
    scene.add(new THREE.AxesHelper(100));
    scene.add(new THREE.AmbientLight(0x404040, 10));
    return scene;
}

function createWorld() {
    world = new CANNON.World();
    world.broadphase = new CANNON.SAPBroadphase(world);
    world.solver.iterations = 5;
    world.defaultContactMaterial.contactEquationStiffness = 1e6;
    world.defaultContactMaterial.contactEquationRelaxation = 10;
    world.defaultContactMaterial.restitution = 1;
    world.defaultContactMaterial.friction = 0.0;
    world.gravity.set(0, 0, 0);
    return world;
}

function addCameraToScene(scene) {
    var VIEW_ANGLE = 50,
    ASPECT = WIDTH / HEIGHT,
    NEAR = 0.1,
    FAR = 10000;

    camera =
    new THREE.PerspectiveCamera(
        VIEW_ANGLE,
        ASPECT,
        NEAR,
        FAR);
    
    camera.position.set(0, 0, 320);

    scene.add(camera);
}

function createRenderer() {
    var c = document.getElementById("gameCanvas");

    renderer = new THREE.WebGLRenderer();

    renderer.setSize(WIDTH, HEIGHT);

    c.appendChild(renderer.domElement);
}

function createBall() {
    var radius = 5,
        segments = 6,
        rings = 6;
    
    var sphereMaterial =
        new THREE.MeshLambertMaterial({
            color: 0xD43001
        });
    
    var threeBall = new THREE.Mesh(
        new THREE.SphereGeometry(
            radius,
            segments,
            rings),
        sphereMaterial);
    
    threeBall.receiveShadow = true;
    threeBall.castShadow = true;
    threeBall.name = "ball";

    var ballMaterial = new CANNON.Material();

    var cannonBall = new CANNON.Body({
        mass: 1,
        position: new CANNON.Vec3(0, 0, radius),
        velocity: new CANNON.Vec3(1, 0, 0),
        shape: new CANNON.Sphere(radius),
        material: ballMaterial,
        linearDamping: 0,
        linearFactor: new CANNON.Vec3(1, 1, 0),
    });

    ball = new GameObject(threeBall, cannonBall);
    ball.addToAll(scene, world);
    return ball;
}

function createPlayerPaddle() {
    var paddleWidth = 10,
        paddleHeight = 30,
        paddleDepth = 10,
        paddleQuality = 1;

    var playerPaddleMaterial =
        new THREE.MeshLambertMaterial({
            color: 0x1B32C0
        });

    var threePlayerPaddle = new THREE.Mesh(
        new THREE.BoxGeometry(
            paddleWidth,
            paddleHeight,
            paddleDepth,
            paddleQuality,
            paddleQuality,
            paddleQuality),
        playerPaddleMaterial);
    
    threePlayerPaddle.receiveShadow = true;
    threePlayerPaddle.castShadow = true;
    threePlayerPaddle.name = "paddle1";

    var cannonPlayerPaddle = new CANNON.Body({
        type: CANNON.Body.KINEMATIC,
        position: new CANNON.Vec3(-fieldWidth / 2 + paddleWidth, 0, paddleDepth),
        shape: new CANNON.Box(new CANNON.Vec3(paddleWidth / 2, paddleHeight / 2, paddleDepth / 2)),
        material: new CANNON.Material(),
    });

    var playerPaddle = new GameObject(threePlayerPaddle, cannonPlayerPaddle);
    playerPaddle.addToAll(scene, world);
    return playerPaddle;

    /*var playerPaddleMaterial =
        new THREE.MeshLambertMaterial({
            color: 0x1B32C0
        });
    
    // create the paddle1
    var threePlayerPaddle = new THREE.Mesh(
        new THREE.CylinderGeometry(
            paddleHeight,
            paddleHeight,
            paddleDepth),
        playerPaddleMaterial);
    
    threePlayerPaddle.receiveShadow = true;
    threePlayerPaddle.castShadow = true;
    threePlayerPaddle.name = "paddle1";

    //create cannon paddle
    var cannonPlayerPaddle = new CANNON.Body({
        type: CANNON.Body.KINEMATIC,
        position: new CANNON.Vec3(-fieldWidth / 2 + paddleWidth, 0, paddleDepth),
        shape: new CANNON.Box(new CANNON.Vec3(paddleWidth / 2, paddleHeight / 2, paddleDepth / 2)),
        material: new CANNON.Material(),
    });

    cannonPlayerPaddle.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);

    var playerPaddle = new GameObject(threePlayerPaddle, cannonPlayerPaddle);
    playerPaddle.addToAll(scene, world);
    return playerPaddle;*/
}

function createOpponentPaddle() {
    var paddleWidth = 10,
        paddleHeight = 30,
        paddleDepth = 10,
        paddleQuality = 1;

    var opponentPaddleMaterial =
        new THREE.MeshLambertMaterial({
            color: 0xFF4045
        });

    var threeOpponentPaddle = new THREE.Mesh(
        new THREE.BoxGeometry(
            paddleWidth,
            paddleHeight,
            paddleDepth,
            paddleQuality,
            paddleQuality,
            paddleQuality),
        opponentPaddleMaterial);
    
    threeOpponentPaddle.receiveShadow = true;
    threeOpponentPaddle.castShadow = true;
    threeOpponentPaddle.name = "paddle2";

    var cannonOpponentPaddle = new CANNON.Body({
        type: CANNON.Body.KINEMATIC,
        position: new CANNON.Vec3(fieldWidth / 2 - paddleWidth, 0, paddleDepth),
        shape: new CANNON.Box(new CANNON.Vec3(paddleWidth / 2, paddleHeight / 2, paddleDepth / 2)),
        material: new CANNON.Material(),
    });

    var opponentPaddle = new GameObject(threeOpponentPaddle, cannonOpponentPaddle);
    opponentPaddle.addToAll(scene, world);
    return opponentPaddle;
}

function init() {
    world = createWorld();

    scene = createScene();

    addCameraToScene(scene);

    cannonDebugger = new CannonDebugger(scene, world)

    createRenderer();

    var planeWidth = fieldWidth,
        planeHeight = fieldHeight,
        planeQuality = 10;

    var planeMaterial =
        new THREE.MeshLambertMaterial({
            color: 0x4BD121
        });

    var tableMaterial =
        new THREE.MeshLambertMaterial({
            color: 0x111111
        });

    var groundMaterial =
        new THREE.MeshLambertMaterial({
            color: 0x888888
        });

    var threePlane = new THREE.Mesh(
        new THREE.PlaneGeometry(
            planeWidth * 0.95,
            planeHeight,
            planeQuality,
            planeQuality),
        planeMaterial);
    threePlane.receiveShadow = true;
    threePlane.name = "plane";

    var cannonPlane = new CANNON.Body({
        mass: 0,
        position: new CANNON.Vec3(0, 0, 0),
        shape: new CANNON.Plane(),
        material: new CANNON.Material()
    });

    var plane = new GameObject(threePlane, cannonPlane);
    plane.addToAll(scene, world);

    const planeXmin = new CANNON.Body({
        mass: 0,
        material: new CANNON.Material(),
        shape: new CANNON.Plane(),
        position: new CANNON.Vec3(0, -fieldHeight / 2, 0),
        quaternion: new CANNON.Quaternion().setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2)
    })
    world.addBody(planeXmin)

    const planeXmax = new CANNON.Body({
        mass: 0,
        material: new CANNON.Material(),
        shape: new CANNON.Plane(),
        position: new CANNON.Vec3(0, fieldHeight / 2, 0),
        quaternion: new CANNON.Quaternion().setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2)
    })
    world.addBody(planeXmax)
    
    var threeTable = new THREE.Mesh(
        new THREE.BoxGeometry(
            planeWidth * 1.05,
            planeHeight * 1.03,
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
        shape: new CANNON.Box(new CANNON.Vec3(planeWidth * 1.05 / 2, planeHeight * 1.03 / 2, 100 / 2)),
        material: new CANNON.Material()
    });

    var table = new GameObject(threeTable, cannonTable);
    table.addToScene(scene);
    table.addToWorld(world);

    ball = createBall();

    paddle1 = createPlayerPaddle();

    paddle2 = createOpponentPaddle();

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

    renderer.shadowMap.enabled = true;
}

function draw() {
    matchScoreCheck();
    cameraPhysics();
    playerPaddleMovement();
    opponentPaddleMovement();

    world.step(1);
    ball.sync();
    paddle1.sync();
    paddle2.sync();
    cannonDebugger.update()

    renderer.render(scene, camera);

    requestAnimationFrame(draw);
}

function opponentPaddleMovement() {
    paddle2.cannonObject.velocity.y = Math.min(
        Math.max(
            (ball.cannonObject.position.y - paddle2.cannonObject.position.y) * difficulty,
            -paddleSpeed),
        paddleSpeed);
    
    paddle2.cannonObject.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 0, 1), paddle2.cannonObject.velocity.y < 0 ? 0.1 : -0.1);
}

function playerPaddleMovement() {
    var moveDirection = 0;
    if (Key.isDown(Key.A) && paddle1.cannonObject.position.y < fieldHeight * 0.40)
        moveDirection = 1;
    else if (Key.isDown(Key.D) && paddle1.cannonObject.position.y > -fieldHeight * 0.40)
        moveDirection = -1;
    
    paddle1.cannonObject.velocity.y = moveDirection * paddleSpeed;
    //tilt paddle in direction of motion to anchieve slicing effect
    paddle1.cannonObject.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 0, 1), moveDirection * 0.1);
}

function cameraPhysics() {
    camera.position.x = paddle1.cannonObject.position.x - 100;
    camera.position.y += (paddle1.cannonObject.position.y - camera.position.y) * 0.05;
    camera.position.z = paddle1.cannonObject.position.z + 100 + 0.04 * (-ball.cannonObject.position.x + paddle1.cannonObject.position.x);

    camera.rotation.x = -0.01  * Math.PI / 180;
    camera.rotation.y = -60 * Math.PI / 180;
    camera.rotation.z = -90 * Math.PI / 180;
}

function resetBall(direction) {
    ball.cannonObject.position.x = 0;
    ball.cannonObject.position.y = 0;

    ball.cannonObject.velocity.x = direction;
    ball.cannonObject.velocity.y = direction;
}

function matchScoreCheck() {
    if (ball.cannonObject.position.x <= (-fieldWidth / 2) * 0.95 - 5) {
        score2++;
        document.getElementById("scores").innerHTML = score1 + "-" + score2;
        resetBall(-1);
    }

    if (ball.cannonObject.position.x >= fieldWidth / 2) {
        score1++;
        document.getElementById("scores").innerHTML = score1 + "-" + score2;
        resetBall(1);
    }

    if (score1 >= maxScore) {
        resetBall(0);

        document.getElementById("scores").innerHTML = "Player wins!";
        document.getElementById("winnerBoard").innerHTML = "Refresh to play again";
    }
    else if (score2 >= maxScore) {
        resetBall(0);

        document.getElementById("scores").innerHTML = "CPU wins!";
        document.getElementById("winnerBoard").innerHTML = "Refresh to play again";
    }
}