import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import CannonDebugger from 'cannon-es-debugger'

import Key from './keyboard.js';

const WIDTH = 640;
const HEIGHT = 360;

// scene object variables
var world;
var renderer, scene, camera;
var cannonDebugger;
var puck, playerPaddle, opponentPaddle;

// field variables
var fieldWidth = 200,
    fieldHeight = 400;

// paddle variables
var paddleSpeed = 3;

// game-related variables
var score1 = 0,
    score2 = 0,
    maxScore = 7;

// set opponent difficulty (0 - easiest, 1 - hardest)
var difficulty = 0.1;

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

function createScene() {
    scene = new THREE.Scene();
    scene.add(new THREE.AxesHelper(100));
    scene.add(new THREE.AmbientLight(0x404040, 10));
    return scene;
}

function createWorld() {
    world = new CANNON.World();
    world.defaultContactMaterial.contactEquationStiffness = 1e6;
    world.defaultContactMaterial.contactEquationRelaxation = 10;
    world.defaultContactMaterial.restitution = 1;
    world.defaultContactMaterial.friction = 0.0;
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

function createPuck() {
    var radius = 10;

    var puckMaterial =
        new THREE.MeshLambertMaterial({
            color: 0xD43001
        });

    var threePuck = new THREE.Mesh(
        new THREE.CylinderGeometry(
            radius,
            radius,
            5),
        puckMaterial);

    threePuck.receiveShadow = true;
    threePuck.castShadow = true;
    threePuck.name = "puck";

    var puckMaterial = new CANNON.Material();

    var cannonPuck = new CANNON.Body({
        mass: 1,
        position: new CANNON.Vec3(0, 0, 5),
        velocity: new CANNON.Vec3(-1, -1, 0),
        shape: new CANNON.Sphere(radius),
        material: puckMaterial,
        linearDamping: 0,
        linearFactor: new CANNON.Vec3(1, 1, 0),
        angularDamping: 0,
        angularFactor: new CANNON.Vec3(0, 0, 0),
        collisionFilterGroup: 2,
        collisionFilterMask: 1 | 4
    });

    cannonPuck.name = "puck";

    cannonPuck.addEventListener("collide", function (e) {
        console.log(e.body.name)
        console.log("paddle hit");
    });

    cannonPuck.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);

    var puck = new GameObject(threePuck, cannonPuck);
    puck.addToAll(scene, world);
    return puck;
}

function createPaddle(name) {
    let radius = 30;
    var paddleHeigth = 10;

    var threePaddleGroup = new THREE.Group();
    threePaddleGroup.name = name;

    // create the paddle
    var threePaddle = new THREE.Mesh(
        new THREE.CylinderGeometry(
            radius / 2,
            radius / 2,
            paddleHeigth / 2),
        new THREE.MeshLambertMaterial({
            color: 0x1B32C0
        })
    );

    threePaddle.receiveShadow = true;
    threePaddle.castShadow = true;

    threePaddleGroup.add(threePaddle);

    var threePaddleTop = new THREE.Mesh(
        new THREE.CylinderGeometry(
            radius / 4,
            radius / 4,
            paddleHeigth),
        new THREE.MeshLambertMaterial({
            color: 0x1B32A0
        })
    );

    threePaddleTop.receiveShadow = true;
    threePaddleTop.castShadow = true;
    threePaddleTop.position.y = paddleHeigth;

    threePaddleGroup.add(threePaddleTop);


    var threePaddleCap = new THREE.Mesh(
        new THREE.SphereGeometry(radius / 4),
        new THREE.MeshLambertMaterial({
            color: 0x1B32F0
        })
    );

    threePaddleCap.receiveShadow = true;
    threePaddleCap.castShadow = true;
    threePaddleCap.position.y = paddleHeigth * 3 / 2;

    threePaddleGroup.add(threePaddleCap);

    //create cannon paddle
    var cannonPaddle = new CANNON.Body({
        type: CANNON.Body.DYNAMIC,
        mass: 1000,
        position: new CANNON.Vec3(-fieldHeight / 2 + radius, 0, paddleHeigth),
        shape: new CANNON.Cylinder(radius / 2, radius / 2, paddleHeigth / 2, 32),
        material: new CANNON.Material(),
        linearDamping: 0,
        linearFactor: new CANNON.Vec3(1, 1, 0),
        angularDamping: 0,
        angularFactor: new CANNON.Vec3(0, 0, 0),
        collisionFilterGroup: 1,
        collisionFilterMask: 2 | 4 | 6
    });

    cannonPaddle.name = name;

    cannonPaddle.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);

    var paddle = new GameObject(threePaddleGroup, cannonPaddle);
    paddle.addToAll(scene, world);
    return paddle;
}

function createBoardBox() {
    const planeYmin = new CANNON.Body({
        mass: 0,
        material: new CANNON.Material(),
        shape: new CANNON.Plane(),
        position: new CANNON.Vec3(0, -fieldWidth / 2, 0),
        quaternion: new CANNON.Quaternion().setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2),
        collisionFilterGroup: 4,
        collisionFilterMask: 1 | 2
    })
    world.addBody(planeYmin)

    const planeYmax = new CANNON.Body({
        mass: 0,
        material: new CANNON.Material(),
        shape: new CANNON.Plane(),
        position: new CANNON.Vec3(0, fieldWidth / 2, 0),
        quaternion: new CANNON.Quaternion().setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2),
        collisionFilterGroup: 4,
        collisionFilterMask: 1 | 2
    })
    world.addBody(planeYmax)

    const planeXmin = new CANNON.Body({
        mass: 0,
        material: new CANNON.Material(),
        shape: new CANNON.Plane(),
        position: new CANNON.Vec3(-fieldHeight / 2, 0, 0),
        quaternion: new CANNON.Quaternion().setFromAxisAngle(new CANNON.Vec3(0, 1, 0), Math.PI / 2),
        collisionFilterGroup: 4,
        collisionFilterMask: 1 | 2
    })
    world.addBody(planeXmin)

    const planeXmax = new CANNON.Body({
        mass: 0,
        material: new CANNON.Material(),
        shape: new CANNON.Plane(),
        position: new CANNON.Vec3(fieldHeight / 2, 0, 0),
        quaternion: new CANNON.Quaternion().setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -Math.PI / 2),
        collisionFilterGroup: 4,
        collisionFilterMask: 1 | 2
    })
    world.addBody(planeXmax)

    const planeX0min = new CANNON.Body({
        mass: 0,
        material: new CANNON.Material(),
        shape: new CANNON.Box(new CANNON.Vec3(10.5, fieldWidth / 2, 30)),
        quaternion: new CANNON.Quaternion().setFromAxisAngle(new CANNON.Vec3(0, 1, 0), Math.PI),
        collisionFilterGroup: 6,
        collisionFilterMask: 1
    })
    world.addBody(planeX0min)
}

function init() {
    world = createWorld();

    scene = createScene();

    addCameraToScene(scene);

    cannonDebugger = new CannonDebugger(scene, world)

    createRenderer();

    var planeHeight = fieldHeight,
        planeWidth = fieldWidth,
        planeQuality = 10;

    var planeMaterial =
        new THREE.MeshBasicMaterial({
            map: new THREE.TextureLoader().load('images/table.jpg')
        })

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
            planeHeight * 0.95,
            planeWidth,
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

    createBoardBox();

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

    puck = createPuck();

    playerPaddle = createPaddle("playerPaddle");

    opponentPaddle = createPaddle("opponentPaddle");
    opponentPaddle.cannonObject.position.x *= -1;

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

    //TODO: fix this
    puck.cannonObject.velocity.x = Math.min(Math.max(puck.cannonObject.velocity.x, -5), 5);
    puck.cannonObject.velocity.y = Math.min(Math.max(puck.cannonObject.velocity.y, -5), 5);

    puck.sync();
    playerPaddle.sync();
    opponentPaddle.sync();
    cannonDebugger.update()

    renderer.render(scene, camera);

    requestAnimationFrame(draw);
}

function opponentPaddleMovement() {
    opponentPaddle.cannonObject.velocity = new CANNON.Vec3(0, 0, 0);
    let impulseFactor = opponentPaddle.cannonObject.mass;
    let impulse = new CANNON.Vec3(
        Math.min(
            Math.max(
                (puck.cannonObject.position.x - opponentPaddle.cannonObject.position.x) * difficulty,
                -paddleSpeed),
            paddleSpeed) * impulseFactor,
        Math.min(
            Math.max(
                (puck.cannonObject.position.y - opponentPaddle.cannonObject.position.y) * difficulty,
                -paddleSpeed),
            paddleSpeed) * impulseFactor,
        0);

    opponentPaddle.cannonObject.applyImpulse(impulse);
}

function playerPaddleMovement() {
    var moveDirectionX = 0;
    var moveDirectionY = 0;
    
    if (Key.isDown(Key.A))
        moveDirectionY = 1;
    else if (Key.isDown(Key.D))
        moveDirectionY = -1;
    
    if (Key.isDown(Key.W))
        moveDirectionX = 1;
    else if (Key.isDown(Key.S))
        moveDirectionX = -1;

    playerPaddle.cannonObject.velocity = new CANNON.Vec3(0, 0, 0);
    let impulseFactor = playerPaddle.cannonObject.mass * paddleSpeed;
    playerPaddle.cannonObject.applyImpulse(new CANNON.Vec3(moveDirectionX * impulseFactor, moveDirectionY * impulseFactor, 0));
}

function cameraPhysics() {
    camera.position.x = -300;
    camera.position.y = 0;
    camera.position.z = 200;

    camera.rotation.x = 0;
    camera.rotation.y = -50 * Math.PI / 180;
    camera.rotation.z = -90 * Math.PI / 180;
}

function resetPuck(direction) {
    puck.cannonObject.position.x = 0;
    puck.cannonObject.position.y = 0;

    puck.cannonObject.velocity.x = direction;
    puck.cannonObject.velocity.y = direction;
}

function resetPaddles() {
    playerPaddle.cannonObject.position.x = -fieldHeight / 2 + 10;
    playerPaddle.cannonObject.position.y = 0;

    opponentPaddle.cannonObject.position.x = fieldHeight / 2 - 10;
    opponentPaddle.cannonObject.position.y = 0;
}

function matchScoreCheck() {
    var scoreLineLimit = (fieldHeight / 2) * 0.99 - puck.cannonObject.shapes[0].radius;
    if (puck.cannonObject.position.x <= -scoreLineLimit) {
        score2++;
        document.getElementById("scores").innerHTML = score1 + "-" + score2;
        resetPuck(-1);
        resetPaddles();
    }

    if (puck.cannonObject.position.x >= scoreLineLimit) {
        score1++;
        document.getElementById("scores").innerHTML = score1 + "-" + score2;
        resetPuck(1);
        resetPaddles();
    }

    if (score1 >= maxScore) {
        resetPuck(0);
        resetPaddles();

        document.getElementById("scores").innerHTML = "Player wins!";
        document.getElementById("winnerBoard").innerHTML = "Refresh to play again";
    } else if (score2 >= maxScore) {
        resetPuck(0);
        resetPaddles();

        document.getElementById("scores").innerHTML = "CPU wins!";
        document.getElementById("winnerBoard").innerHTML = "Refresh to play again";
    }
}

export function setup() {
    document.getElementById("winnerBoard").innerHTML = "First to " + maxScore + " wins!";

    init();

    draw();
}