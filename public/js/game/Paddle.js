import * as THREE from '../vendor/three.module.min.js';

import * as CANNON from 'cannon-es';

import {
    GameObject
} from './GameObject.js';

export class Paddle extends GameObject {
    constructor(name) {
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
                color: 0x1B32F0
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
                color: 0x1B32F0
            })
        );

        threePaddleTop.receiveShadow = true;
        threePaddleTop.castShadow = true;
        threePaddleTop.position.y = paddleHeigth * 3 / 4;

        threePaddleGroup.add(threePaddleTop);


        var threePaddleCap = new THREE.Mesh(
            new THREE.SphereGeometry(radius / 4),
            new THREE.MeshPhongMaterial({
                color: 0x1B32F0
            })
        );

        threePaddleCap.receiveShadow = true;
        threePaddleCap.castShadow = true;
        threePaddleCap.position.y = paddleHeigth * 5 / 4;

        threePaddleGroup.add(threePaddleCap);

        //create cannon paddle
        var cannonPaddle = new CANNON.Body({
            type: CANNON.Body.DYNAMIC,
            mass: 1000,
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

        super(name, threePaddleGroup, cannonPaddle);
    }
}