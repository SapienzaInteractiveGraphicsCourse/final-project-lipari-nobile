import * as THREE from 'three';
import {
    FontLoader
} from 'three/addons/loaders/FontLoader.js';

export async function loadFont(globalContext) {
    const font = await new FontLoader()
        .loadAsync('./fonts/Nunito.json');
    
    globalContext.font = font;

    return globalContext;
}

export async function loadAudioBuffer(globalContext, audioLink) {
    const audioBuffer = await new THREE.AudioLoader()
        .loadAsync(audioLink);

    const audioTitle = audioLink.split('/').pop().split('.')[0];

    globalContext[audioTitle] = audioBuffer;
    
    return globalContext;
}