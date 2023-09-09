import * as CANNON from 'cannon-es';
import {
    Paddle
} from './Paddle.js';

export class OpponentPaddle extends Paddle {
    constructor({
        name = 'opponentPaddle',
        paddleSpeed = 3,
        difficulty = 0.5,
        targetPuck
    }) {
        if (!targetPuck) throw new Error('targetPuck is required');
        super(name);
        this.paddleSpeed = paddleSpeed;
        this.difficulty = difficulty;
        this.targetPuck = targetPuck;
    }

    update() {
        this.cannonObject.velocity = new CANNON.Vec3(0, 0, 0);
        let impulseFactor = this.cannonObject.mass;
        let impulse = new CANNON.Vec3(
            Math.min(
                Math.max(
                    (this.targetPuck.cannonObject.position.x - this.cannonObject.position.x) * this.difficulty,
                    -this.paddleSpeed),
                this.paddleSpeed) * impulseFactor,
            Math.min(
                Math.max(
                    (this.targetPuck.cannonObject.position.y - this.cannonObject.position.y) * this.difficulty,
                    -this.paddleSpeed),
                this.paddleSpeed) * impulseFactor,
            0);
    
            this.cannonObject.applyImpulse(impulse);
    }
}