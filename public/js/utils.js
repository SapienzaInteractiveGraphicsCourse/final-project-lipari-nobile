import * as THREE from 'three';
import {
    TextGeometry
} from 'three/addons/geometries/TextGeometry.js';
import {
    FontLoader
} from 'three/addons/loaders/FontLoader.js';

let bevelEnabled = true;

export function toggleBevelEnabled() {
    bevelEnabled = !bevelEnabled;
}

export function setBevelEnabled(enable) {
    bevelEnabled = enable;
}

export async function loadFont(globalContext) {
    const font = await new FontLoader()
        .loadAsync('../fonts/Nunito.json')

    // if globalContext is null then return font
    if (globalContext) {
        globalContext.font = font;
    }

    return globalContext ? globalContext : font;
}

class Text extends TextGeometry {
    constructor({
        text,
        font,
        size
    }) {
        const height = 5,
            curveSegments = 4,
            bevelThickness = 1,
            bevelSize = 1.5;
        super(text, {
            font,
            size,
            height,
            curveSegments,
            bevelThickness,
            bevelSize,
            bevelEnabled
        });
    }
}

export class TextBox extends THREE.Group {
    isOpen = false;
    constructor({
        name,
        text,
        font,
        material,
        size = 30
    }) {
        super();

        let textMesh = new THREE.Mesh(
            new Text({
                text,
                font,
                size
            }),
            material
        );

        textMesh.name = 'text';

        //center text mesh
        textMesh.geometry.computeBoundingBox();
        textMesh.position.set(
            -0.5 * (textMesh.geometry.boundingBox.max.x - textMesh.geometry.boundingBox.min.x),
            -0.5 * (textMesh.geometry.boundingBox.max.y - textMesh.geometry.boundingBox.min.y),
            -0.5 * (textMesh.geometry.boundingBox.max.z - textMesh.geometry.boundingBox.min.z)
        );

        this.add(textMesh);

        let textBox3 = new THREE.Box3()
            .setFromObject(textMesh);

        let textBox = new THREE.Mesh(
            new THREE.BoxGeometry(
                textBox3.max.x - textBox3.min.x,
                textBox3.max.y - textBox3.min.y,
                textBox3.max.z - textBox3.min.z
            ),
            new THREE.MeshBasicMaterial({
                color: 0x00ff00,
                transparent: true,
                opacity: 0
            })
        )

        textBox.name = 'box';

        //textBox.position.set(textMesh.position.x, textMesh.position.y, textMesh.position.z)

        this.add(textBox);

        this.name = name;
    }
}