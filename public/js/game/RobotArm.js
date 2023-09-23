import * as THREE from 'three';
import { CCDIKSolver, CCDIKHelper } from 'three/addons/animation/CCDIKSolver.js';

import {
    GameObject
} from './GameObject.js';

export class RobotArm {
    targetPosition;
    constructor({targetPosition, name, scene}) {
        let bones = []

        let armHeight = 220;
        let segments = 2;
        let segmentSize = armHeight / segments;

        // "root"
        let rootBone = new THREE.Bone();
        rootBone.position.x = 220;
        rootBone.position.y = 0;
        rootBone.position.z = 5;
        bones.push(rootBone);

        // "bone0"
        let prevBone = new THREE.Bone();
        prevBone.position.y = 0;
        rootBone.add(prevBone);
        bones.push(prevBone);

        // "bone1", "bone2", "bone3"
        for (let i = 1; i <= segments; i++) {
            const bone = new THREE.Bone();
            bone.position.z = segmentSize;
            bones.push(bone);

            prevBone.add(bone);
            prevBone = bone;
        }

        // "target"
        const targetBone = new THREE.Bone();
        this.ikTarget = targetBone;
        targetBone.position.z = armHeight + segmentSize;
        rootBone.add(targetBone);
        bones.push(targetBone);

        //
        // skinned mesh
        //
        let geometry = new THREE.CylinderGeometry(
            5, // radiusTop
            5, // radiusBottom
            armHeight, // height
            8, // radiusSegments
            segments, // heightSegments
            true // openEnded
        )

        geometry.translate(220, 0, 0);
        geometry.rotateX(Math.PI / 2);
        geometry.translate(0, 0, (armHeight)/2 + 5);
        const position = geometry.attributes.position;

        const vertex = new THREE.Vector3();

        const skinIndices = [];
        const skinWeights = [];

        for (let i = 0; i < position.count; i++) {

            vertex.fromBufferAttribute(position, i);

            const y = (vertex.z + armHeight/2);

            const skinIndex = Math.floor(y / segmentSize);
            const skinWeight = (y % segmentSize) / segmentSize;

            skinIndices.push(skinIndex, skinIndex + 1, 0, 0);
            skinWeights.push(1 - skinWeight, skinWeight, 0, 0);
        }

        geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4));
        geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4));

        let material = new THREE.MeshPhongMaterial({
            color: 0x156289,
            emissive: 0x072534,
            side: THREE.DoubleSide,
            flatShading: true,
            wireframe: true
        });

        material = new THREE.MeshLambertMaterial({
            color: 0xff9000
        });

        const mesh = new THREE.SkinnedMesh(geometry, material);
        const skeleton = new THREE.Skeleton(bones);

        mesh.add(bones[0]); // "root" bone
        mesh.bind(skeleton);

        scene.add(mesh);

        let skeletonHelper = new THREE.SkeletonHelper(mesh);
        skeletonHelper.material.linewidth = 2;
        scene.add(skeletonHelper);

        const iks = [{
            target: 4, // "target"
            effector: 3, // "bone3"
            links: [{
                index: 2
            }, {
                index: 1
            }] // "bone2", "bone1", "bone0"
        }];
        this.ikSolver = new CCDIKSolver(mesh, iks);
        scene.add( new CCDIKHelper( mesh, iks ) );

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