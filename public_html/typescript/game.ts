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
            this.game.load.image("restartArrow", "assets/restartArrow.png");
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
        static MOVEMENT_VELOCITY: number = 350;
        controlKeys: any; // object for determining what keypresses are used in the game

        numberOfLives: number;
        livesGroup: Phaser.Group;

        score: number;
        textScore: Phaser.Text;
        isGameOver: boolean;

        // for making the difficult vary. the difficulty will change randomly
        spawnRate: number;
        static DIFFICULTY_EASY: number = 400;
        static DIFFICULTY_MEDIUM: number = GameState.DIFFICULTY_EASY * 0.35 + GameState.DIFFICULTY_EASY;
        static DIFFICULTY_HARD: number = GameState.DIFFICULTY_EASY * 0.66 + GameState.DIFFICULTY_EASY;

        coffeeGroup: Phaser.Group;

        constructor() {
            super();
        }

        /* 
         * using the init method for resetting game variables
         */
        init() {
            this.isGameOver = false;
            this.numberOfLives = 5;
            this.score = 0;
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
            this.player = this.game.add.sprite(this.game.world.centerX, this.ground.top - 80, this.game.cache.getBitmapData("player"));

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
                // kill this sprite if it's out of bounds, passing the player
                coffee.checkWorldBounds = true;
                coffee.outOfBoundsKill = true;
                coffee.events.onOutOfBounds.add(() => {
                    if (!this.isGameOver) {
                        this.score += 10; // each coffee avoided is worth ten points
                        this.textScore.text = "Score: " + this.score;
                    }
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
            if (this.isGameOver) {
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

            // if the lives counter reaches zero, end the game
            if (this.numberOfLives === 0) {
                if (!this.isGameOver) {
                    this.isGameOver = true;
                    let gameOverText = this.game.add.text(this.game.camera.width / 2, this.game.camera.height / 2,
                        "Game Over!\nYour score: " + this.score,
                        {
                            font: "5em Impact, sans-serif",
                            fill: "#42f45f",
                            align: "center"
                        });
                    gameOverText.anchor.setTo(0.5, 0.5);
                    gameOverText.alpha = 0.90;

                    // display restart arrow that restarts the game
                    let restartButton = this.game.add.button(this.game.camera.width / 2, 0, "restartArrow", () => {
                        this.game.state.start("PreloadState", true, true);
                    }, this);
                    restartButton.scale.setTo(0.4, 0.4);;
                    restartButton.anchor.setTo(0.5, 0.5);
                    restartButton.y = gameOverText.bottom + restartButton.height
                    // make it rotate
                    let tween = this.game.add.tween(restartButton).to({rotation: (restartButton.rotation + 6.28) * - 1}, 2500, null, true, 0, -1);
                }
            }
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