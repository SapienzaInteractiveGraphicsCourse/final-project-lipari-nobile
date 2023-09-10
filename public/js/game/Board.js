import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import {
    TextGeometry
} from 'three/addons/geometries/TextGeometry.js';

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

export class Board extends GameObjectGroup {
    playerScore = 0;
    opponentScore = 0;
    maxScore = 7;
    difficulty = 0.3;

    paddleSpeed = 3;
    puckSpeed = 5;

    font;

    fieldHeight = 400;
    fieldWidth = 200;
    fieldDepth = 10;

    scoreSound;
    gameEndSound;

    constructor(globalContext) {
        super();

        this.font = globalContext.font;

        this.add(this.createWall(this.fieldDepth, this.fieldHeight, this.fieldDepth)
            .setPosition(0, -(this.fieldWidth / 2 + this.fieldDepth / 2), 0)
            .setRotation(new CANNON.Vec3(0, 0, 1), -Math.PI / 2));

        this.add(this.createWall(this.fieldDepth, this.fieldHeight, this.fieldDepth)
            .setPosition(0, (this.fieldWidth / 2 + this.fieldDepth / 2), 0)
            .setRotation(new CANNON.Vec3(0, 0, 1), Math.PI / 2));

        this.add(this.createWall(this.fieldWidth, this.fieldDepth, this.fieldDepth)
            .setPosition(-(this.fieldHeight / 2 + this.fieldDepth / 2), 0, 0)
            .setRotation(new CANNON.Vec3(0, 0, 1), Math.PI / 2));

        this.add(this.createWall(this.fieldWidth, this.fieldDepth, this.fieldDepth)
            .setPosition((this.fieldHeight / 2 + this.fieldDepth / 2), 0, 0)
            .setRotation(new CANNON.Vec3(0, 0, 1), Math.PI / 2));

        this.add(this.createDivider(10.5, this.fieldWidth / 2, this.fieldDepth / 2));

        this.add(this.createSurfacePlane(this.fieldHeight, this.fieldWidth)
            .setPosition(0, 0, -this.fieldDepth / 2));

        this.add(this.createPlayerScore()
            .setPosition(-this.fieldHeight / 4, 0, 0)
            .setRotation(new CANNON.Vec3(0, 0, 1), -Math.PI / 2));

        this.add(this.createOpponentScore()
            .setPosition(this.fieldHeight / 4, 0, 0)
            .setRotation(new CANNON.Vec3(0, 0, 1), -Math.PI / 2));

        const onCollide = (event) => {
            console.log(globalContext["puck_hit"])
            !globalContext["puck_hit"].isPlaying &&  globalContext["puck_hit"].play();
        }    

        this.add(new Puck(onCollide)
            .setPosition(0, 0, 5)
            .setVelocity(-1, 0, 0));

        this.add(new PlayerPaddle({
                name: 'playerPaddle',
                paddleSpeed: this.paddleSpeed
            })
            .setPosition(-this.fieldHeight / 2 + 20, 0, 5));

        this.add(new OpponentPaddle({
                name: 'opponentPaddle',
                paddleSpeed: this.paddleSpeed,
                difficulty: this.difficulty,
                targetPuck: this.gameObjects.find(x => x.name == "puck")
            })
            .setPosition(this.fieldHeight / 2 - 20, 0, 5));
         
        this.scoreSound = globalContext["goal"] 
        
        this.gameEndSound = globalContext["game_end"]

        globalContext["game_start"].play();    
    }

    createWall(x, y, z) {
        let threeObject = new THREE.Mesh(
            new THREE.BoxGeometry(x, y, z),
            new THREE.MeshLambertMaterial({
                color: 0x0090ff
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
        let cannonObject = new CANNON.Body({
            mass: 0,
            material: new CANNON.Material(),
            shape: new CANNON.Box(new CANNON.Vec3(x, y, z)),
            collisionFilterGroup: 6,
            collisionFilterMask: 1
        });
        return new GameObject("divder", null, cannonObject);
    }

    createSurfacePlane(x, y) {
        let threeObject = new THREE.Mesh(
            new THREE.PlaneGeometry(x, y),
            new THREE.MeshBasicMaterial({
                map: new THREE.TextureLoader().load('../images/table.jpg')
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
    }

    checkIfScored() {
        const puck = this.gameObjects.find(x => x.name == "puck");

        var scoreLineLimit = (this.fieldHeight / 2) * 0.99 - puck.cannonObject.shapes[0].radius;

        if (puck.cannonObject.position.x <= -scoreLineLimit) {
            !this.scoreSound.isPlaying && this.scoreSound.play();
            this.increaseOpponentScore();
            this.resetPuck(-1);
            this.resetPaddles();
        }

        if (puck.cannonObject.position.x >= scoreLineLimit) {
            !this.scoreSound.isPlaying && this.scoreSound.play();
            this.increasePlayerScore();
            this.resetPuck(1);
            this.resetPaddles();
        }

        this.checkIfWin();
    }

    checkIfWin() {
        if (this.playerScore >= this.maxScore) {
            !this.gameEndSound.isPlaying && this.gameEndSound.play();
            this.resetPuck(0);
            this.resetPaddles();
            this.showWinMessage();
        } else if (this.opponentScore >= this.maxScore) {
            !this.gameEndSound.isPlaying && this.gameEndSound.play();
            this.resetPuck(0);
            this.resetPaddles();
            this.showWinMessage();
        }
    }

    resetPuck(direction) {
        this.gameObjects.find(x => x.name == "puck")
            .setPosition(0, 0, 5)
            .setVelocity(direction, direction, 0);
    }

    resetPaddles() {
        this.gameObjects.find(x => x.name == "playerPaddle")
            .setPosition(-this.fieldHeight / 2 + 20, 0, 5);

        this.gameObjects.find(x => x.name == "opponentPaddle")
            .setPosition(this.fieldHeight / 2 - 20, 0, 5);
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
        messageGameObject.addToAll(this.scene, this.world);
        this.add(messageGameObject);
    }

    sync() {
        this.gameObjects.forEach(gameObject => {
            gameObject.sync();
        });
    }
}