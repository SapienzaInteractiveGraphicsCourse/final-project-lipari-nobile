export class GameObjectGroup {
    scene;
    world;

    constructor(gameObjects = []) {
        this.gameObjects = gameObjects;
    }

    addAll(gameObjects) {
        gameObjects.forEach(gameObject => {
            this.add(gameObject);
        });
        return this;
    }

    add(gameObject) {
        this.gameObjects.push(gameObject);
        return this;
    }

    removeByName(name) {
        this.gameObjects = this.gameObjects.filter(x => x.name !== name);
        return this;
    }

    sync() {
        this.gameObjects.forEach(gameObject => {
            gameObject.sync();
        });
        return this;
    }

    addToScene(scene) {
        this.gameObjects.forEach(gameObject => {
            gameObject.addToScene(scene);
        });
        this.scene = scene;
        return this;
    }

    addToWorld(world) {
        this.gameObjects.forEach(gameObject => {
            gameObject.addToWorld(world);
        });
        this.world = world;
        return this;
    }

    addToAll(scene, world) {
        this.addToScene(scene);
        this.addToWorld(world);
        return this;
    }
}