import * as THREE from 'three';
import { CCDIKSolver, CCDIKHelper } from 'three/addons/animation/CCDIKSolver.js';

import {
    GameObject
} from './GameObject.js';

export class RobotArm extends GameObject {
    targetPosition;
    constructor({targetPosition, name, scene}) {
        let bones = []

        // "root"
        let rootBone = new THREE.Bone();
        rootBone.position.x = 220;
        rootBone.position.y = 0;
        rootBone.position.z = 5;
        bones.push(rootBone);

        // "bone0"
        let prevBone = new THREE.Bone();
        rootBone.add(prevBone);
        bones.push(prevBone);

        // "bone1", "bone2", "bone3"
        for (let i = 1; i <= 10; i++) {
            const bone = new THREE.Bone();
            bone.position.z = 12;
            bones.push(bone);

            prevBone.add(bone);
            prevBone = bone;
        }

        // "target"
        const targetBone = new THREE.Bone();
        targetBone.position.z = 120;
        rootBone.add(targetBone);
        bones.push(targetBone);

        //
        // skinned mesh
        //
        let geometry = new THREE.CylinderGeometry(
            5, // radiusTop
            5, // radiusBottom
            120, // height
            12, // radiusSegments
            10, // heightSegments
            true // openEnded
        )

        geometry.translate(220, 0, 0);
        geometry.rotateX(Math.PI / 2);
        geometry.translate(0, 0, 65);
        const position = geometry.attributes.position;

        const vertex = new THREE.Vector3();

        const skinIndices = [];
        const skinWeights = [];

        for (let i = 0; i < position.count; i++) {

            vertex.fromBufferAttribute(position, i);

            const y = (vertex.y + 60);

            const skinIndex = Math.floor(y / 12);
            const skinWeight = (y % 12) / 12;

            skinIndices.push(skinIndex, skinIndex + 1, 0, 0);
            skinWeights.push(1 - skinWeight, skinWeight, 0, 0);

        }

        geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4));
        geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4));

        const material = new THREE.MeshPhongMaterial({
            color: 0x156289,
            emissive: 0x072534,
            side: THREE.DoubleSide,
            flatShading: true,
            wireframe: true
        });

        const mesh = new THREE.SkinnedMesh(geometry, material);
        const skeleton = new THREE.Skeleton(bones);

        mesh.add(bones[0]); // "root" bone
        mesh.bind(skeleton);

        super(name, mesh, null);

        let skeletonHelper = new THREE.SkeletonHelper(mesh);
        skeletonHelper.material.linewidth = 2;
        scene.add(skeletonHelper);

        const iks = [{
            target: 12, // "target"
            effector: 11, // "bone3"
            links: [{
                index: 10,
            }, {
                index: 9,
            }, {
                index: 8,
            }, {
                index: 7,
            }, {
                index: 6,
            }, {
                index: 5,
            }, {
                index: 4,
            }, {
                index: 3
            }, {
                index: 2
            }, {
                index: 1
            }] // "bone2", "bone1", "bone0"
        }];
        this.ikSolver = new CCDIKSolver(mesh, iks);
        scene.add(new CCDIKHelper(mesh, iks));

        this.ikTarget = targetBone;
        this.targetPosition = targetPosition;
    }

    setTargetPosition(targetPosition) {
        this.targetPosition = targetPosition;
        return this;
    }

    update() {
        this.ikTarget.position.x = this.targetPosition.x;
        this.ikTarget.position.y = this.targetPosition.y;
        this.ikTarget.position.z = this.targetPosition.z;
        this.ikSolver.update();
    }
}