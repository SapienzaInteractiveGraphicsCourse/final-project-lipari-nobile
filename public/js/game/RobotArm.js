import * as THREE from 'three';
import { CCDIKSolver, CCDIKHelper } from 'three/addons/animation/CCDIKSolver.js';

export class RobotArm {
    constructor({name, scene}) {
        let bones = []

        let armLength = 220;
        let segments = 2;
        let segmentLength = armLength / segments;

        // "root"
        let rootBone = new THREE.Bone();
        rootBone.position.x = 210;
        rootBone.position.y = 0;
        rootBone.position.z = 40;
        bones.push(rootBone);

        // "bone0"
        let prevBone = new THREE.Bone();
        rootBone.add(prevBone);
        bones.push(prevBone);

        // "bone1", "bone2", "bone3"
        for (let i = 1; i <= segments; i++) {
            const bone = new THREE.Bone();
            bone.position.x = -segmentLength;
            bones.push(bone);

            prevBone.add(bone);
            prevBone = bone;
        }

        // "target"
        const targetBone = new THREE.Bone();
        this.ikTarget = targetBone;
        targetBone.position.x = - (armLength + segmentLength);
        rootBone.add(targetBone);
        bones.push(targetBone);

        //
        // skinned mesh
        //
        let geometry = new THREE.CylinderGeometry(
            5, // radiusTop
            5, // radiusBottom
            armLength, // height
            8, // radiusSegments
            segments, // heightSegments
            false // openEnded
        )

        geometry.rotateZ(Math.PI / 2);
        geometry.translate(105, 0, 40);
        const position = geometry.attributes.position;

        const vertex = new THREE.Vector3();

        const skinIndices = [];
        const skinWeights = [];

        for (let i = 0; i < position.count; i++) {

            vertex.fromBufferAttribute(position, i);

            let x = (220 - vertex.x);

            const skinIndex = Math.floor(x / segmentLength);
            const skinWeight = (x % segmentLength) / segmentLength;

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

        mesh.name = name;

        scene.add(mesh);

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

        this.ikTarget = targetBone;
    }

    setTargetPosition(x, y, z) {
        this.ikTarget.position.x = x;
        this.ikTarget.position.y = y;
        this.ikTarget.position.z = z;
        return this;
    }

    update() {
        this.ikSolver.update();
    }
}