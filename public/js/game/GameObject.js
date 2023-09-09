export class GameObject {
    name;
    world;

    constructor(name, threeObject, cannonObject) {
        this.name = name;
        this.threeObject = threeObject;
        this.cannonObject = cannonObject;
        this.sync();
    }

    getPosition() {
        if (!this.cannonObject) return this.threeObject.position;
        return this.cannonObject.position;
    }

    setPosition(x, y, z) {
        if (!this.cannonObject) {
            this.threeObject.position.set(x, y, z);
        } else {
            this.cannonObject.position.set(x, y, z);
        }
        this.sync();
        return this;
    }

    getRotation() {
        if (!this.cannonObject) return this.threeObject.quaternion;
        return this.cannonObject.quaternion;
    }

    setRotation(vec, angle) {
        if (!this.cannonObject) {
            this.threeObject.quaternion.setFromAxisAngle(vec, angle);
        } else {
            this.cannonObject.quaternion.setFromAxisAngle(vec, angle);
        }
        this.sync();
        return this;
    }

    getVelocity() {
        if (!this.cannonObject) return new CANNON.Vec3(0, 0, 0);
        return this.cannonObject.velocity;
    }

    setVelocity(x, y, z) {
        if (this.cannonObject) this.cannonObject.velocity.set(x, y, z);
        return this;
    }

    sync() {
        if (!this.threeObject || !this.cannonObject) return this;
        this.threeObject.position.copy(this.cannonObject.position);
        this.threeObject.quaternion.copy(this.cannonObject.quaternion);
        return this;
    }

    addTo(gameObjectGroup) {
        gameObjectGroup.add(this);
        return this;
    }

    addToScene(scene) {
        if (this.threeObject) scene.add(this.threeObject);
        return this;
    }

    removeFromScene() {
        if (this.threeObject) this.threeObject.removeFromParent();
        return this;
    }

    addToWorld(world) {
        if (this.cannonObject) world.addBody(this.cannonObject);
        this.world = world;
        return this;
    }

    removeFromWorld() {
        if (this.cannonObject && this.world) this.world.removeBody(this.cannonObject);
        return this;
    }

    addToAll(scene, world) {
        this.addToScene(scene);
        this.addToWorld(world);
        return this;
    }

    removeFromAll() {
        this.removeFromScene();
        this.removeFromWorld();
        return this;
    }
}