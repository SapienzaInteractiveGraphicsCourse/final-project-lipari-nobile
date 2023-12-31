import * as THREE from '../vendor/three.module.min.js';

import * as CANNON from '../vendor/cannon-es.js';

import {
    GameObject
} from './GameObject.js';

export class Puck extends GameObject {
    puckSpeed = 5;
    constructor(onCollide) {
        var radius = 10;

        var puckMaterial =
            new THREE.MeshPhongMaterial({
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

        cannonPuck.addEventListener("collide", onCollide)

        cannonPuck.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);

        super("puck", threePuck, cannonPuck);
    }

    update() {
        this.setVelocity(
            Math.min(Math.max(this.cannonObject.velocity.x, -this.puckSpeed), this.puckSpeed),
            Math.min(Math.max(this.cannonObject.velocity.y, -this.puckSpeed), this.puckSpeed),
            0
        );  
    }
}