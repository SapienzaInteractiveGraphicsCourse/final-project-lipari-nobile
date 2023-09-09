import * as THREE from 'three';
import {
    FontLoader
} from 'three/addons/loaders/FontLoader.js';

export async function loadFont(globalContext) {
    const font = await new FontLoader()
        .loadAsync('../fonts/Nunito.json');
    
    globalContext.font = font;

    return globalContext;
}

export async function loadAudioBuffer(globalContext) {
    const audioBuffer = await new THREE.AudioLoader()
        .loadAsync('../sounds/BOX_15.mp3');
    
    globalContext.audioBuffer = audioBuffer;
    
    return globalContext;
}