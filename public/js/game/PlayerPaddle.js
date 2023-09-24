import * as CANNON from '../vendor/cannon-es.js';
import Key from '../utils/keyboard.js';
import { Paddle } from './Paddle.js';

export class PlayerPaddle extends Paddle {
    constructor({
        name = 'playerPaddle',
        paddleSpeed = 3,
    }) {
        super(name);
        this.paddleSpeed = paddleSpeed;
    }

    update() {
        var moveDirectionX = 0;
        var moveDirectionY = 0;
        
        if (Key.isDown(Key.A))
            moveDirectionY = 1;
        else if (Key.isDown(Key.D))
            moveDirectionY = -1;
        
        if (Key.isDown(Key.W))
            moveDirectionX = 1;
        else if (Key.isDown(Key.S))
            moveDirectionX = -1;
    
        this.cannonObject.velocity = new CANNON.Vec3(0, 0, 0);
        let impulseFactor = this.cannonObject.mass * this.paddleSpeed;
        this.cannonObject.applyImpulse(new CANNON.Vec3(moveDirectionX * impulseFactor, moveDirectionY * impulseFactor, 0));
    }
}