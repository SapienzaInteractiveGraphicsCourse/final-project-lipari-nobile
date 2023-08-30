import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { setup } from './game.js'

/* Variables */
let container; // canvas
let options, credits, menuContainer; 
let camera, cameraTarget, scene, renderer; 
let group, textStartGeo, textStartMesh, textOptionGeo, textOptionMesh, textCreditsGeo, textCreditsMesh, materials; // group, text, textMesh, textGeo, materials
let textStart = 'Start game',
    textOption = 'Options',
    textCredits = 'Credits',
    bevelEnabled = true,
    font = undefined,
    fontName = 'optimer', // helvetiker, optimer, gentilis, droid sans, droid serif
    fontWeight = 'bold'; // normal bold
const height = 10,
	size = 30,
	hover = 15,
    curveSegments = 4,
    bevelThickness = 1,
	bevelSize = 1.5;

let targetRotation = 0;
let targetRotationOnPointerDown = 0;
let pointerX = 0;
let pointerXOnPointerDown = 0;

let windowHalfX = window.innerWidth / 2;
let raycaster;
let mouse;
let sound, listener;

init();
animate();


class Button extends THREE.Mesh {
    #isClicked = false;
    constructor({name, textMesh, geometry, positionY, positionX}){
        super(textMesh, geometry);
        this.name = name;
        this.position.set(positionX, positionY, 0);
    }

    get isClicked() {
        return this.#isClicked;
    }

    set isClicked(value) {
        this.#isClicked = value;
    }

}

class Text extends TextGeometry {
    constructor({text}){
        super(text, {font, size, height, curveSegments, bevelThickness, bevelSize, bevelEnabled});
    }
}

function init() {

	container = document.getElementById( 'menuCanvas' );
    options = document.getElementById('options')
    credits = document.getElementById('credits')
    menuContainer = document.getElementById('menuContainer')

	/* Camera */
	camera = new THREE.PerspectiveCamera( 35, container.clientWidth / container.clientHeight, 0.1, 2000 );
	camera.position.set( 0, 100, 500 );
	cameraTarget = new THREE.Vector3( 0, 40, 0 );

	/* SCENE */
    scene = new THREE.Scene();
	scene.fog = new THREE.Fog( 0x000000, 250, 1400 );
    
    /* LIGHTS */
	const dirLight = new THREE.DirectionalLight( 0xffffff, 0.4 );
	dirLight.position.set( 0, 0, 1 ).normalize();
	scene.add( dirLight );

    /* Raycaster */
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2(1,1);

    /* Audio */
    listener = new THREE.AudioListener();
    camera.add(listener);

    // create an Ambient audio source
    sound = new THREE.Audio(listener);

    const songElement = document.getElementById('song')
    sound.setMediaElementSource(songElement);
    sound.setFilter( listener.context.createWaveShaper() );
    sound.setLoop(true);
    songElement.play();

	const pointLight = new THREE.PointLight( 0xffffff, 4.5, 0, 0 );
	pointLight.color.setHSL( Math.random(), 1, 0.5 );
	pointLight.position.set( 0, 100, 90 );
	scene.add( pointLight );

	materials = [
		new THREE.MeshPhongMaterial( { color: 0xffffff, flatShading: true } ), // front
		new THREE.MeshPhongMaterial( { color: 0xffffff } ) // side
	];

    /* Group */
	group = new THREE.Group();
	group.position.y = 100;

	scene.add( group );

	loadFont();

	/* RENDERER */
	renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } ); // alpha turn background transparent
    renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( container.clientWidth , container.clientHeight );
	container.appendChild( renderer.domElement );

	/* EVENTS */
	container.style.touchAction = 'none';
	container.addEventListener( 'pointerdown', onPointerDown );
    container.addEventListener( 'mousemove', onMoveMove );
	window.addEventListener( 'resize', onWindowResize );

    /* Menu GUI */
	const params = {
		changeColor: function () {
			pointLight.color.setHSL( Math.random(), 1, 0.5 );
		},
		changeBevel: function () {
            bevelEnabled = ! bevelEnabled;
			refreshText();
		}
	};

    const SoundControls = function () {
        this.master = listener.getMasterVolume();
    };


	const gui = new GUI();
    const textFolder = gui.addFolder( 'Text' );
    const soundControls = new SoundControls();
    const volumeFolder = gui.addFolder('Volume');

    textFolder.add( params, 'changeBevel' ).name( 'change bevel' );
    textFolder.add(params, 'changeColor').name('change color');
    
    volumeFolder.add( soundControls, 'master' ).min( 0.0 ).max( 1.0 ).step( 0.01 ).onChange( function () {

        listener.setMasterVolume( soundControls.master );

    } );
}

function onWindowResize() {
    console.log('resize')
	windowHalfX = container.clientWidth / 2;

	camera.aspect = container.clientWidth / container.clientHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( container.clientWidth, container.clientHeight );

}

function loadFont() {

	const loader = new FontLoader();
	loader.load( '../fonts/Nunito.json', function ( response ) {

	font = response;

	refreshText();

    } );
}

function createText() {

    textStartGeo = new Text({ text: textStart})

    textOptionGeo = new Text({text: textOption})

    textCreditsGeo = new Text({text: textCredits})

	textStartGeo.computeBoundingBox();
    textOptionGeo.computeBoundingBox();
    textCreditsGeo.computeBoundingBox();
	const centerOffset = - 0.5 * ( textStartGeo.boundingBox.max.x - textStartGeo.boundingBox.min.x );
    const centerOptionOffset = - 0.5 * ( textOptionGeo.boundingBox.max.x - textOptionGeo.boundingBox.min.x );
    const centerCreditsOffset = - 0.5 * ( textCreditsGeo.boundingBox.max.x - textCreditsGeo.boundingBox.min.x );

    textStartMesh = new Button({name: 'start', textMesh: textStartGeo, geometry: materials, positionY: hover, positionX: centerOffset});
	textStartMesh.rotation.y = Math.PI * 2;
	group.add( textStartMesh );

    textOptionMesh = new Button({name: 'option', textMesh: textOptionGeo, geometry: materials, positionY: hover * -4, positionX: centerOptionOffset})
    group.add(textOptionMesh);

    textCreditsMesh = new Button({name: 'credits', textMesh: textCreditsGeo, geometry: materials, positionY: hover * -9, positionX: centerCreditsOffset})
    group.add(textCreditsMesh);

}

function refreshText() {
	group.remove( textStartMesh );
    group.remove( textOptionMesh);
    group.remove( textCreditsMesh)

	if ( ! textStart ) return;
	createText();
}

function onPointerDown( event ) {

	if ( event.isPrimary === false ) return;

	pointerXOnPointerDown = event.clientX - windowHalfX;
	targetRotationOnPointerDown = targetRotation;
	document.addEventListener( 'pointermove', onPointerMove );
	document.addEventListener( 'pointerup', onPointerUp );
}

function onPointerMove( event ) {
	if ( event.isPrimary === false ) return;

	pointerX = event.clientX - windowHalfX;
	targetRotation = targetRotationOnPointerDown + ( pointerX - pointerXOnPointerDown ) * 0.02;
}

function onPointerUp(event) {
	if ( event.isPrimary === false ) return;

	document.removeEventListener( 'pointermove', onPointerMove );
	document.removeEventListener( 'pointerup', onPointerUp );

    // raycaster check intersection
    raycaster.setFromCamera( mouse, camera)
    const intersectes = raycaster.intersectObjects( scene.children);

    // Get the heights of the footers
    const optionHeight = options.clientHeight;
    const creditsHeight = credits.clientHeight;

    // Get the first intersection object - I'm not interested in consecutive intersections
    const firstIntersect = intersectes.length > 0 && intersectes[0];
    console.log(firstIntersect)

    if(!firstIntersect) return;

    if(firstIntersect.object.name === 'start') {

        // Hide the menu
        menuContainer.style.display = 'none';

        // Start the game
        document.getElementById('gameContainer').style.display = 'block';
        setup();

        // Stop the sound
        sound.stop();

        // Close the GUI
        console.log('start game')
    }
    if(firstIntersect.object.name === 'option') {
        // Close the credits if it's open
        if(credits.style.bottom == `0px`){
            credits.style.bottom = `-${creditsHeight}px`;
            document.body.style.marginBottom = `0px`;

            // Reset option text
            textCredits = 'Credits';
            refreshText();
        }

        // If it's already open, close it
        if(options.style.bottom == `0px`){
            options.style.bottom = `-${optionHeight}px`;
            document.body.style.marginBottom = `0px`;

            // Reset option text
            textOption = 'Options';
            refreshText();
            return;
        }

        options.style.bottom = `0px`;

        // Scroll the content to make the footer visible
        document.body.style.marginBottom = `${optionHeight}px`;

        // Change Option text to close
        textOption = 'Close Options';

        refreshText();
    }
    if(firstIntersect.object.name === 'credits') {
        
        // Close the options if it's open
        if(options.style.bottom == `0px`){
            options.style.bottom = `-${optionHeight}px`;
            document.body.style.marginBottom = `0px`;

            // Reset option text
            textOption = 'Options';
            refreshText();
        }

        // If it's already open, close it
        if(credits.style.bottom == `0px`){
            credits.style.bottom = `-${creditsHeight}px`;
            document.body.style.marginBottom = `0px`;

            // Reset option text
            textCredits = 'Credits';
            refreshText();
            return;
        }

        credits.style.bottom = `0px`;

        // Scroll the content to make the footer visible
        document.body.style.marginBottom = `${creditsHeight}px`;

        // Change Option text to close
        textCredits = 'Close Credits';
        // set isClicked to true
        textCreditsMesh.isClicked = true;
        refreshText();
    }
    
}

function onMoveMove(event) {

    // Calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components

    const rect = renderer.domElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    mouse.x = ( x / container.clientWidth ) * 2 - 1;
	mouse.y = - ( y / container.clientHeight ) * 2 + 1;
}

function hoverButton() {
    raycaster.setFromCamera( mouse, camera );
    const intersectes = raycaster.intersectObjects( scene.children);
    
    intersectes.length === 0 && scene.children[2].children.forEach(child => {
      child.scale.set(1,1,1)
    });

    for(let i = 0; i < intersectes.length; i++) {
        intersectes[i].object.scale.set(1.1, 1.1, 1.1);
    }

}

function startAnimationChangeText(){
    const texts = scene.children[2].children;

    texts.forEach(text => {
        //text.scale.set(0.9, 1.0, 1.0);
        
    })
};  

/* Event listener to change master volume */
document.getElementById('volume').addEventListener('input', (event) => {
    console.log(event)
    const volume = event.target.value / 100;
    console.log(volume)
    sound.setVolume(volume);
    listener.setMasterVolume(volume);
})

function animate() {
    sound.setVolume(0.1)
    hoverButton();
    startAnimationChangeText();
	requestAnimationFrame( animate );
	render();
}
function render() {
	group.rotation.y += ( targetRotation - group.rotation.y ) * 0.05;
	camera.lookAt( cameraTarget );
	renderer.clear();
	renderer.render( scene, camera );
}