import * as THREE from '../vendor/three.module.min.js';

import * as CANNON from '../vendor/cannon-es.js';
import {
    TextGeometry
} from '../vendor/TextGeometry.js';

import {
    GameObject
} from './GameObject.js';
import {
    GameObjectGroup
} from './GameObjectGroup.js';

import {
    PlayerPaddle
} from './PlayerPaddle.js';
import {
    OpponentPaddle
} from './OpponentPaddle.js';
import {
    Puck
} from './Puck.js';
import {
    RobotArm
} from './RobotArm.js';


export class Board extends GameObjectGroup {
    playerScore = 0;
    opponentScore = 0;
    // retrieve from document input the max score
    maxScore = document.getElementById('points').value;
    
    difficulty = 0.3;

    paddleSpeed = 3;
    puckSpeed = 5;

    font;

    fieldHeight = 400;
    fieldWidth = 200;
    fieldDepth = 10;

    scoreSound;
    gameEndSound;
    isGameEndend = false;

    constructor(globalContext) {
        super();

        let ele = document.getElementsByName('difficulty');
        for (let i = 0; i < ele.length; i++) {
            if (ele[i].checked)
                this.difficulty = ele[i].value / 2;
        }

        this.font = globalContext.font;

        this.add(this.createWall(this.fieldDepth, this.fieldHeight + 2 * this.fieldDepth, this.fieldDepth)
            .setPosition(0, -(this.fieldWidth / 2 + this.fieldDepth / 2), 0)
            .setRotation(new CANNON.Vec3(0, 0, 1), -Math.PI / 2));

        this.add(this.createWall(this.fieldDepth, this.fieldHeight + 2 * this.fieldDepth, this.fieldDepth)
            .setPosition(0, (this.fieldWidth / 2 + this.fieldDepth / 2), 0)
            .setRotation(new CANNON.Vec3(0, 0, 1), Math.PI / 2));

        this.add(this.createWall(this.fieldWidth, this.fieldDepth, this.fieldDepth)
            .setPosition(-(this.fieldHeight / 2 + this.fieldDepth / 2), 0, 0)
            .setRotation(new CANNON.Vec3(0, 0, 1), Math.PI / 2));

        this.add(this.createWall(this.fieldWidth, this.fieldDepth, this.fieldDepth)
            .setPosition((this.fieldHeight / 2 + this.fieldDepth / 2), 0, 0)
            .setRotation(new CANNON.Vec3(0, 0, 1), Math.PI / 2));

        this.add(this.createDivider(10.5, this.fieldWidth, this.fieldDepth));

        this.add(this.createSurfacePlane(this.fieldHeight, this.fieldWidth)
            .setPosition(0, 0, -this.fieldDepth / 2));

        this.add(this.createPlayerScore()
            .setPosition(-this.fieldHeight / 4, 0, 0)
            .setRotation(new CANNON.Vec3(0, 0, 1), -Math.PI / 2));

        this.add(this.createOpponentScore()
            .setPosition(this.fieldHeight / 4, 0, 0)
            .setRotation(new CANNON.Vec3(0, 0, 1), -Math.PI / 2));

        const onCollide = (event) => {
            !globalContext["puck_hit"].isPlaying && globalContext["puck_hit"].play();
        }

        this.add(new Puck(onCollide)
            .setVelocity(-1, 0, 0));

        this.add(new PlayerPaddle({
                name: 'playerPaddle',
                paddleSpeed: this.paddleSpeed
            })
            .setPosition(-this.fieldHeight / 2 + 20, 0, 0));

        this.add(new OpponentPaddle({
                name: 'opponentPaddle',
                paddleSpeed: this.paddleSpeed,
                difficulty: this.difficulty,
                targetPuck: this.gameObjects.find(x => x.name == "puck")
            })
            .setPosition(this.fieldHeight / 2 - 20, 0, 0));

        this.add(this.createWall(20, 20, 60)
            .setPosition((this.fieldHeight / 2 + this.fieldDepth / 2) + 15, 0, 25));

        this.robotArm = new RobotArm({
            name: "robotArm",
            scene: globalContext.scene,
        });

        this.scoreSound = globalContext["goal"]

        this.gameEndSound = globalContext["game_end"]

        globalContext["game_start"].play();
    }

    createWall(x, y, z) {
        let texture = new THREE.TextureLoader().load('./images/osb.jpg');
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(x/y, y/x);
        let threeObject = new THREE.Mesh(
            new THREE.BoxGeometry(x, y, z),
            new THREE.MeshPhongMaterial({
                map: texture
            })
        );
        let cannonObject = new CANNON.Body({
            mass: 0,
            material: new CANNON.Material(),
            shape: new CANNON.Box(new CANNON.Vec3(x / 2, y / 2, z / 2)),
            collisionFilterGroup: 4,
            collisionFilterMask: 1 | 2
        });
        return new GameObject("wall", threeObject, cannonObject);
    }

    createDivider(x, y, z) {
        let threeObject = new THREE.Mesh(
            new THREE.BoxGeometry(x, y, z),
            new THREE.MeshLambertMaterial({
                color: 0x1B32C0,
                transparent: true,
                opacity: 0.5
            })
        );
        let cannonObject = new CANNON.Body({
            mass: 0,
            material: new CANNON.Material(),
            shape: new CANNON.Box(new CANNON.Vec3(x / 2, y / 2, z / 2)),
            collisionFilterGroup: 6,
            collisionFilterMask: 1
        });
        return new GameObject("divder", threeObject, cannonObject);
    }

    createSurfacePlane(x, y) {
        let threeObject = new THREE.Mesh(
            new THREE.PlaneGeometry(x, y),
            new THREE.MeshPhongMaterial({
                map: new THREE.TextureLoader().load('./images/table.jpg')
            })
        );
        let cannonObject = new CANNON.Body({
            mass: 0,
            material: new CANNON.Material(),
            shape: new CANNON.Plane()
        });
        return new GameObject("plane", threeObject, cannonObject);
    }

    createPlayerScore() {
        let threeObject = new THREE.Mesh(
            new TextGeometry(this.playerScore.toString(), {
                font: this.font,
                size: 20,
                height: 5
            }),
            new THREE.MeshLambertMaterial({
                color: 0xff0fff
            })
        );
        threeObject.geometry.computeBoundingBox()
        threeObject.geometry.translate(-threeObject.geometry.boundingBox.max.x / 2, -threeObject.geometry.boundingBox.max.y / 2, -threeObject.geometry.boundingBox.max.z / 2);

        return new GameObject("playerScore", threeObject, null);
    }

    createOpponentScore() {
        let threeObject = new THREE.Mesh(
            new TextGeometry(this.opponentScore.toString(), {
                font: this.font,
                size: 20,
                height: 5
            }),
            new THREE.MeshLambertMaterial({
                color: 0xff0fff
            })
        );
        threeObject.geometry.computeBoundingBox()
        threeObject.geometry.translate(-threeObject.geometry.boundingBox.max.x / 2, -threeObject.geometry.boundingBox.max.y / 2, -threeObject.geometry.boundingBox.max.z / 2);

        return new GameObject("opponentScore", threeObject, null);
    }

    increasePlayerScore() {
        this.playerScore++;
        this.checkIfWin();
        this.updateScore();
    }

    increaseOpponentScore() {
        this.opponentScore++;
        this.checkIfWin();
        this.updateScore();
    }

    updateScore() {
        this.gameObjects.find(x => x.name == "playerScore").removeFromAll();
        this.removeByName("playerScore");
        this.gameObjects.find(x => x.name == "opponentScore").removeFromAll();
        this.removeByName("opponentScore");

        this.add(this.createPlayerScore()
            .setPosition(-this.fieldHeight / 4, 0, 0)
            .setRotation(new CANNON.Vec3(0, 0, 1), -Math.PI / 2)
            .addToAll(this.scene, this.world));
        this.add(this.createOpponentScore()
            .setPosition(this.fieldHeight / 4, 0, 0)
            .setRotation(new CANNON.Vec3(0, 0, 1), -Math.PI / 2)
            .addToAll(this.scene, this.world));
    }

    update() {
        this.checkIfScored();

        this.gameObjects.find(x => x.name == "playerPaddle")
            .update();

        this.gameObjects.find(x => x.name == "opponentPaddle")
            .update();

        this.gameObjects.find(x => x.name == "puck")
            .update();

        this.robotArm.setTargetPosition(
            this.gameObjects.find(x => x.name == "opponentPaddle").threeObject.position.x - 210,
            this.gameObjects.find(x => x.name == "opponentPaddle").threeObject.position.y,
            this.gameObjects.find(x => x.name == "opponentPaddle").threeObject.position.z - 40
        );

        this.robotArm.update();
    }

    checkIfScored() {
        const puck = this.gameObjects.find(x => x.name == "puck");

        var scoreLineLimit = (this.fieldHeight / 2) * 0.99 - puck.cannonObject.shapes[0].radius;

        if (puck.cannonObject.position.x <= -scoreLineLimit) {
            !this.scoreSound.isPlaying && this.scoreSound.play();
            this.increaseOpponentScore();
            this.resetPuck(-0.5);
            this.resetPaddles();
        }

        if (puck.cannonObject.position.x >= scoreLineLimit) {
            !this.scoreSound.isPlaying && this.scoreSound.play();
            this.increasePlayerScore();
            this.resetPuck(0.5);
            this.resetPaddles();
        }
        this.checkIfWin();
    }

    checkIfWin() {
        const endModal = document.getElementById('endgame');
        if (this.playerScore >= this.maxScore) {
            // prevent to play sound multiple times
            !this.isGameEndend && this.gameEndSound.play();
            this.resetPuck(0);
            this.resetPaddles();
            this.showWinMessage();
            this.isGameEndend = true;
            if (!endModal.open) endModal.showModal();
        } else if (this.opponentScore >= this.maxScore) {
            !this.isGameEndend && this.gameEndSound.play();
            this.resetPuck(0);
            this.resetPaddles();
            this.showWinMessage();
            this.isGameEndend = true;
            if (!endModal.open) endModal.showModal();
        }
    }

    resetPuck(direction) {
        this.gameObjects.find(x => x.name == "puck")
            .setPosition(0, 0, 0)
            .setVelocity(direction, direction, 0);
    }

    resetPaddles() {
        this.gameObjects.find(x => x.name == "playerPaddle")
            .setPosition(-this.fieldHeight / 2 + 20, 0, 0);

        this.gameObjects.find(x => x.name == "opponentPaddle")
            .setPosition(this.fieldHeight / 2 - 20, 0, 0);
    }

    resetBoard() {
        // reset all the variables
        this.playerScore = 0;
        this.opponentScore = 0;
        this.isGameEndend = false;
        this.updateScore();
        this.resetPuck(1);
    }

    showWinMessage() {
        var message = this.playerScore > this.opponentScore ? "You win!" : "You lose!";
        var messageObject = new THREE.Mesh(
            new TextGeometry(message, {
                font: this.font,
                size: 20,
                height: 5
            }),
            new THREE.MeshLambertMaterial({
                color: 0xff0fff
            })
        );
        messageObject.geometry.computeBoundingBox()
        messageObject.geometry.translate(-messageObject.geometry.boundingBox.max.x / 2, -messageObject.geometry.boundingBox.max.y / 2, -messageObject.geometry.boundingBox.max.z / 2);

        var messageGameObject = new GameObject("message", messageObject, null);
        messageGameObject.setPosition(0, 0, 10);
        messageGameObject.setRotation(new THREE.Vector3(0, 0, 1), -Math.PI / 2);
        //messageGameObject.addToAll(this.scene, this.world);
        //this.add(messageGameObject);

        document.getElementById("textEndGame").innerHTML = message;
    }

    sync() {
        this.gameObjects.forEach(gameObject => {
            gameObject.sync();
        });
    }
}