import * as THREE from '../vendor/three.module.min.js';

import {
    FontLoader
} from '../vendor/FontLoader.js';

export async function loadFont(globalContext) {
    const font = await new FontLoader()
        .loadAsync('./final-project-lipari-nobile/public/fonts/Nunito.json');
    
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