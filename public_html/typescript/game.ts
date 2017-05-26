/*
 * Template
 */
module IHateCoffee {
    /*
     * Boot state for only loading the loading screen
     */
    export class BootState extends Phaser.State {
        constructor() {
            super();
        }

        init() {
            // Set scale using ScaleManager
            // Set background color
        }

        preload() {
            // Load loading screen image
        }

        create() {
            // Start true loading state
            this.game.state.start("PreloadState");
        }
    }

    /*
     * Preload state for actually loading assets
     */
    export class PreloadState extends Phaser.State {
        constructor() {
            super();
        }

        preload() {
            // Display the loading screen image
            // Load assets
        }

        create() {
            this.game.state.start("GameState");
        }
    }

    /*
     * The main game running state
     */
    export class GameState extends Phaser.State {
        game: Phaser.Game;

        player: Phaser.Sprite;
        ground: Phaser.Sprite;

        constructor() {
            super();
        }

        create() {
            // use P2 physics
            this.game.physics.startSystem(Phaser.Physics.P2JS);
            this.game.physics.p2.gravity.y = 250;

            // and also using arcade physics
            this.game.physics.startSystem(Phaser.Physics.ARCADE);
            this.game.physics.arcade.gravity.y = 250;

            // create ground
            let groundBitMapData = this.game.add.bitmapData(this.game.width, 32);
            groundBitMapData.rect(0, 0, groundBitMapData.width, groundBitMapData.height, "rgb(70, 73, 72)");
            this.game.cache.addBitmapData("ground", groundBitMapData);
            this.ground = this.game.add.sprite(0, this.game.height - groundBitMapData.height, this.game.cache.getBitmapData("ground"));

            // change ground's properties to be an arcade physics object
            this.game.physics.arcade.enable(this.ground);
            this.ground.body.immovable = true;
            this.ground.body.allowGravity = false;

            // create player sprite
            let playerBitMapData = this.game.add.bitmapData(32, 64);
            playerBitMapData.rect(0, 0, playerBitMapData.width, playerBitMapData.height, "rgb(255, 255, 255");
            this.game.cache.addBitmapData("player", playerBitMapData);
            this.player = this.game.add.sprite(10, 10, this.game.cache.getBitmapData("player"));

            // add P2 physics, but only for now, because we might change our mind later
            this.game.physics.p2.enable(this.player, true);
            this.player.body.clearShapes();
            this.player.body.addRectangle(32, 64);
            this.player.body.collideWorldBounds = true;
            this.player.body.moveLeft(100);
        }

        update() {
            this.game.physics.arcade.collide(this.player, this.ground);
        }
    }

    export class Game {
        game: Phaser.Game;

        constructor() {
            this.game = new Phaser.Game(550, 550, Phaser.AUTO, "phaser");

            /* The boot state will contain an init() for the scale manager and will load the loading screen,
             * while the preloader will display the loading screen and load assets and then start the main game state.
             */
            this.game.state.add("BootState", BootState, true);
            this.game.state.add("PreloadState", PreloadState);
            this.game.state.add("GameState", GameState);
        }
    }
}

window.onload = () => {
    let game = new IHateCoffee.Game();
};