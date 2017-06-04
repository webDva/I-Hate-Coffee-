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

    // used for controlling player's movement
    export enum Direction {
        Left,
        Right
    }

    /*
     * The main game running state
     */
    export class GameState extends Phaser.State {
        game: Phaser.Game;

        // sprites
        player: Phaser.Sprite;
        ground: Phaser.Sprite;

        // input
        isAcceptingMovementInput: boolean = true; // if the player dies, for example
        static MOVEMENT_VELOCITY: number = 350;
        controlKeys: any; // object for determining what keypresses are used in the game

        numberOfLives: number = 5;
        livesGroup: Phaser.Group;

        score: number = 0;
        textScore: Phaser.Text;

        coffeeGroup: Phaser.Group;

        constructor() {
            super();
        }

        create() {
            // use arcade physics
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

            // add physics body to player
            this.game.physics.arcade.enable(this.player);
            this.player.body.collideWorldBounds = true;

            // create coffee sprite
            let coffeeBitMapData = this.game.add.bitmapData(32, 32);
            coffeeBitMapData.rect(0, 0, coffeeBitMapData.width, coffeeBitMapData.height, "rgb(80, 44, 10");
            this.game.cache.addBitmapData("coffee", coffeeBitMapData);

            // create group for coffees for collision
            this.coffeeGroup = this.game.add.group();

            // timer for spawning falling coffees
            let timer = this.game.time.create(false);
            timer.loop(400, () => {
                let coffee = this.game.add.sprite(this.game.rnd.integerInRange(0, this.game.width - 32), 0, this.game.cache.getBitmapData("coffee"));
                // add physics body to coffee sprite
                this.game.physics.arcade.enable(coffee);
                coffee.body.stopVelocityOnCollide = true; // so maybe the coffees won't move the player
                // kill this sprite if it's out of bounds, passing the player
                coffee.checkWorldBounds = true;
                coffee.outOfBoundsKill = true;
                coffee.events.onOutOfBounds.add(() => {
                    this.score += 10; // each coffee avoided is worth ten points
                    this.textScore.text = "Score: " + this.score;
                });
                // add coffee to its coffeeGroup
                this.coffeeGroup.add(coffee);
            }, this);
            timer.start();

            // create hearts to represent health

            // first, use a red placeholder sprite
            let heartBitMapData = this.game.add.bitmapData(32, 32);
            heartBitMapData.circle(16, 16, 16, "rgb(236, 11, 25");
            this.game.cache.addBitmapData("heart", heartBitMapData);

            // display hearts based on number of lives available initially
            this.livesGroup = this.game.add.group();
            for (let i = 0; i < this.numberOfLives; i++) {
                this.livesGroup.create((i + 40) * i, 32, this.game.cache.getBitmapData("heart"));
            }

            // add score text
            let textScoreStyle = {
                font: "4em Impact, sans-serif",
                fill: "#42f45f",
                align: "center"
            };
            this.textScore = this.game.add.text(this.game.width, 0, "Score: " + this.score, textScoreStyle);
            this.textScore.anchor.setTo(1, 0);

            // add WASD controls
            this.controlKeys = this.game.input.keyboard.addKeys({"left": Phaser.KeyCode.A, "right": Phaser.KeyCode.D});
        }

        /*
         * used for controlling the player's movement, left or right
         */
        controlPlayer(direction: IHateCoffee.Direction) {
            // if the player is dead or if switching to another state, then don't accept keypress
            if (!this.isAcceptingMovementInput) {
                return;
            }

            if (direction === IHateCoffee.Direction.Left) {
                this.player.body.velocity.x = -GameState.MOVEMENT_VELOCITY;
            } else if (direction === IHateCoffee.Direction.Right) {
                this.player.body.velocity.x = GameState.MOVEMENT_VELOCITY;
            }
        }

        /*
         * we'll just poll for keyboard input to control the player using the keys object
         */
        pollControllInput() {
            if (this.controlKeys.left.isDown) {
                this.controlPlayer(IHateCoffee.Direction.Left);
            } else if (this.controlKeys.right.isDown) {
                this.controlPlayer(IHateCoffee.Direction.Right);
            }
        }

        coffeePlayerCollisionCallback(player: Phaser.Sprite, coffee: Phaser.Sprite) {
            // for now, just do a little tween and decrement hearts
            let tween = this.game.add.tween(coffee.scale).to({x: 0, y: 0}, 1400, "Linear", true, 0, -1);
            tween.yoyo(true);
            // disable coffe's body
            coffee.body.enable = false;

            // remove a heart and decrement the lives counter
            if (this.livesGroup.getFirstAlive()) {
                this.livesGroup.getFirstAlive().kill();
                this.numberOfLives--;
            }
        }

        update() {
            // collisions
            this.game.physics.arcade.collide(this.player, this.ground);
            this.game.physics.arcade.overlap(this.player, this.coffeeGroup, this.coffeePlayerCollisionCallback, null, this);

            // stop the player's horizontal movement
            this.player.body.velocity.x = 0;

            // poll for the player's input
            this.pollControllInput();
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