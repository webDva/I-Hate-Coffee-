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
            this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
            // Set background color
            this.game.stage.backgroundColor = "#1b58ba";
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
            this.game.load.image("coffee", "assets/coffee.png");
            this.game.load.image("leftButton", "assets/leftarrow.png");
            this.game.load.image("rightButton", "assets/rightarrow.png");
            this.game.load.image("heart", "assets/heart.png");
            this.game.load.spritesheet("iineSpriteSheet", "assets/iineSpriteSheet.png", 32, 64, 5);

            this.game.load.audio("hitSound", "assets/hit.wav");
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

        hitAnimation: Phaser.Animation;

        hitSound: Phaser.Sound;

        // for making the difficult vary. the difficulty will change randomly
        spawnRate: number;
        static DIFFICULTY_EASY: number = 400;
        static DIFFICULTY_MEDIUM: number = GameState.DIFFICULTY_EASY * 0.35 + GameState.DIFFICULTY_EASY;
        static DIFFICULTY_HARD: number = GameState.DIFFICULTY_EASY * 0.66 + GameState.DIFFICULTY_EASY;

        coffeeGroup: Phaser.Group;

        // onscreen controls sprites
        leftButton: Phaser.Button;
        rightButton: Phaser.Button;

        // booleans for button holding
        isLeftButtonPressed: boolean;
        isRightButtonPressed: boolean;

        // only one gamepad (XBOX 360 controller)
        pad1: Phaser.SinglePad;

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

            // add hit sound
            this.hitSound = this.game.add.audio("hitSound");

            // add player sprite
            this.player = this.game.add.sprite(this.game.world.centerX, this.ground.top - (64 * 2 + 10), "iineSpriteSheet", 0);
            this.player.scale.setTo(2, 2);

            // add animation to player sprite
            this.hitAnimation = this.player.animations.add("hit", [1, 2, 3, 4]);
            this.hitAnimation.onComplete.add(() => {
                this.player.frame = 0; // reset the frame back to the non-animation one
            }, this);

            // add physics body to player
            this.game.physics.arcade.enable(this.player);
            this.player.body.collideWorldBounds = true;

            // create group for coffees for collision
            this.coffeeGroup = this.game.add.group();

            // timer for spawning falling coffees
            let timer = this.game.time.create(false);
            timer.loop(400, () => {
                let coffee = this.game.add.sprite(this.game.rnd.integerInRange(0, this.game.width - 32), 0, "coffee");
                coffee.scale.setTo(2, 2);
                // add physics body to coffee sprite
                this.game.physics.arcade.enable(coffee);
                // kill this sprite if it's out of bounds, passing the player
                coffee.checkWorldBounds = true;
                coffee.outOfBoundsKill = true;
                coffee.events.onOutOfBounds.add(() => {
                    if (!this.isGameOver) {
                        this.score += 10; // each coffee avoided is worth ten points
                        this.textScore.text = "" + this.score;
                    }
                });
                // add coffee to its coffeeGroup
                this.coffeeGroup.add(coffee);
            }, this);
            timer.start();

            // display hearts based on number of lives available initially
            this.livesGroup = this.game.add.group();
            for (let i = 0; i < this.numberOfLives; i++) {
                this.livesGroup.create((i + 40) * i, 32, "heart");
            }
            this.livesGroup.reverse(); // this will make the harts disappear from right-to-left

            // add score text
            let textScoreStyle = {
                font: '4em "Segoe UI", Impact, sans-serif',
                fontWeight: "700",
                fill: "#42f45f",
                align: "center"
            };
            this.textScore = this.game.add.text(this.game.width, 0, "" + this.score, textScoreStyle);
            this.textScore.anchor.setTo(1, 0);

            // add WASD controls
            this.controlKeys = this.game.input.keyboard.addKeys({"left": Phaser.KeyCode.A, "right": Phaser.KeyCode.D});

            // add oncscreen controls to the screen, but only if touch is available
            if (this.game.device.touch) {
                this.leftButton = this.game.add.button(40, 380, "leftButton", null, this);
                this.leftButton.fixedToCamera = true;
                this.leftButton.alpha = 0.4;
                this.leftButton.events.onInputDown.add(() => {
                    this.isLeftButtonPressed = true;
                });
                this.leftButton.events.onInputUp.add(() => {
                    this.isLeftButtonPressed = false;
                });

                this.rightButton = this.game.add.button(this.game.width - 40, 380, "rightButton", null, this);
                this.rightButton.anchor.x = 1;
                this.rightButton.fixedToCamera = true;
                this.rightButton.alpha = 0.4;
                this.rightButton.events.onInputDown.add(() => {
                    this.isRightButtonPressed = true;
                });
                this.rightButton.events.onInputUp.add(() => {
                    this.isRightButtonPressed = false;
                });
            }

            // add gamepad controls support for XBOX 360 controller
            this.game.input.gamepad.start();
            this.pad1 = this.game.input.gamepad.pad1;
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
            if (this.controlKeys.left.isDown || this.isLeftButtonPressed) {
                this.controlPlayer(IHateCoffee.Direction.Left);
            } else if (this.controlKeys.right.isDown || this.isRightButtonPressed) {
                this.controlPlayer(IHateCoffee.Direction.Right);
            }

            // listening for gamepad controller input        
            if (this.game.input.gamepad.supported && this.game.input.gamepad.active && this.pad1.connected) {
                if (this.pad1.isDown(Phaser.Gamepad.XBOX360_DPAD_LEFT) || this.pad1.axis(Phaser.Gamepad.XBOX360_STICK_LEFT_X) < -0.1) {
                    this.controlPlayer(IHateCoffee.Direction.Left);
                }
                else if (this.pad1.isDown(Phaser.Gamepad.XBOX360_DPAD_RIGHT) || this.pad1.axis(Phaser.Gamepad.XBOX360_STICK_LEFT_X) > 0.1) {
                    this.controlPlayer(IHateCoffee.Direction.Right);
                }
            }
        }

        coffeePlayerCollisionCallback(player: Phaser.Sprite, coffee: Phaser.Sprite) {
            let tween = this.game.add.tween(coffee.scale).to({x: 0, y: 0}, 200, "Linear", true);
            tween.onComplete.add(() => {
                coffee.kill();
            }, this, 0, coffee);
            // disable coffe's body
            coffee.body.enable = false;

            // remove a heart and decrement the lives counter
            if (this.livesGroup.getFirstAlive()) {
                let firstHeart = this.livesGroup.getFirstAlive();
                let heartTween = this.game.add.tween(firstHeart.scale).to({x: 0, y: 0}, 300, "Linear", true);
                heartTween.onComplete.add(() => {
                    firstHeart.kill();
                }, this, 0, firstHeart);
                this.numberOfLives--;
            }

            // play the hit animation and sound
            this.hitAnimation.play(10);
            this.hitSound.play();
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
                        "Game Over!\nScore: " + this.score,
                        {
                            font: '5em "Segoe UI", Impact, sans-serif',
                            fontWeight: "600",
                            fill: "#42f45f",
                            align: "center"
                        });
                    gameOverText.anchor.setTo(0.5, 0.5);
                    gameOverText.alpha = 0.90;
                    this.textScore.kill();

                    // display restart arrow that restarts the game
                    let restartButton = this.game.add.button(this.game.camera.width / 2, 0, "restartArrow", () => {
                        this.game.state.start("PreloadState", true, true);
                    }, this);
                    restartButton.scale.setTo(0.4, 0.4);;
                    restartButton.anchor.setTo(0.5, 0.5);
                    restartButton.y = gameOverText.bottom + restartButton.height
                    // make it rotate
                    this.game.add.tween(restartButton).to({rotation: (restartButton.rotation + 6.28) * - 1}, 2500, null, true, 0, -1);
                }
            }
        }
    }

    export class Game {
        game: Phaser.Game;

        constructor() {
            this.game = new Phaser.Game(800, 600, Phaser.AUTO, "phaser");

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