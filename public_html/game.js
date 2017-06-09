var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/*
 * Template
 */
var IHateCoffee;
(function (IHateCoffee) {
    /*
     * Boot state for only loading the loading screen
     */
    var BootState = (function (_super) {
        __extends(BootState, _super);
        function BootState() {
            return _super.call(this) || this;
        }
        BootState.prototype.init = function () {
            // Set scale using ScaleManager
            this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
            // Set background color
            this.game.stage.backgroundColor = "#1b58ba";
        };
        BootState.prototype.preload = function () {
            // Load loading screen image
        };
        BootState.prototype.create = function () {
            // Start true loading state
            this.game.state.start("PreloadState");
        };
        return BootState;
    }(Phaser.State));
    IHateCoffee.BootState = BootState;
    /*
     * Preload state for actually loading assets
     */
    var PreloadState = (function (_super) {
        __extends(PreloadState, _super);
        function PreloadState() {
            return _super.call(this) || this;
        }
        PreloadState.prototype.preload = function () {
            // Display the loading screen image
            // Load assets
            this.game.load.image("restartArrow", "assets/restartArrow.png");
            this.game.load.image("coffee", "assets/coffee.png");
            this.game.load.image("leftButton", "assets/leftarrow.png");
            this.game.load.image("rightButton", "assets/rightarrow.png");
            this.game.load.image("heart", "assets/heart.png");
            this.game.load.spritesheet("iineSpriteSheet", "assets/iineSpriteSheet.png", 32, 64, 5);
            this.game.load.image("iHateCoffeeLogo", "assets/iHateCoffeeLogo.png");
            this.game.load.image("startButton", "assets/startButton.png");
            this.game.load.audio("hitSound", "assets/hit.wav");
        };
        PreloadState.prototype.create = function () {
            this.game.state.start("MainMenuState");
        };
        return PreloadState;
    }(Phaser.State));
    IHateCoffee.PreloadState = PreloadState;
    var MainMenuState = (function (_super) {
        __extends(MainMenuState, _super);
        function MainMenuState() {
            return _super.call(this) || this;
        }
        MainMenuState.prototype.create = function () {
            var _this = this;
            // allowing space for the instructions, so logo at the very top
            this.iHateCoffeeLogo = this.game.add.sprite(this.game.world.centerX, 0, "iHateCoffeeLogo");
            this.iHateCoffeeLogo.anchor.setTo(0.5, 0);
            this.iHateCoffeeLogo.scale.setTo(0.5, 0.5);
            // and start button at the very bottom
            this.startButton = this.game.add.button(this.game.world.centerX, this.game.world.height, "startButton", function () {
                _this.game.state.start("GameState");
            }, this);
            this.startButton.anchor.setTo(0.5, 1);
            this.startButton.scale.setTo(0.2, 0.2);
        };
        return MainMenuState;
    }(Phaser.State));
    IHateCoffee.MainMenuState = MainMenuState;
    // used for controlling player's movement
    var Direction;
    (function (Direction) {
        Direction[Direction["Left"] = 0] = "Left";
        Direction[Direction["Right"] = 1] = "Right";
    })(Direction = IHateCoffee.Direction || (IHateCoffee.Direction = {}));
    /*
     * The main game running state
     */
    var GameState = (function (_super) {
        __extends(GameState, _super);
        function GameState() {
            return _super.call(this) || this;
        }
        /*
         * using the init method for resetting game variables
         */
        GameState.prototype.init = function () {
            this.isGameOver = false;
            this.numberOfLives = 5;
            this.score = 0;
        };
        GameState.prototype.create = function () {
            var _this = this;
            // use arcade physics
            this.game.physics.startSystem(Phaser.Physics.ARCADE);
            this.game.physics.arcade.gravity.y = 250;
            // create ground
            var groundBitMapData = this.game.add.bitmapData(this.game.width, 32);
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
            this.hitAnimation.onComplete.add(function () {
                _this.player.frame = 0; // reset the frame back to the non-animation one
            }, this);
            // add physics body to player
            this.game.physics.arcade.enable(this.player);
            this.player.body.collideWorldBounds = true;
            // create group for coffees for collision
            this.coffeeGroup = this.game.add.group();
            // timer for spawning falling coffees
            var timer = this.game.time.create(false);
            timer.loop(400, function () {
                var coffee = _this.game.add.sprite(_this.game.rnd.integerInRange(0, _this.game.width - 32), 0, "coffee");
                coffee.scale.setTo(2, 2);
                // add physics body to coffee sprite
                _this.game.physics.arcade.enable(coffee);
                // kill this sprite if it's out of bounds, passing the player
                coffee.checkWorldBounds = true;
                coffee.outOfBoundsKill = true;
                coffee.events.onOutOfBounds.add(function () {
                    if (!_this.isGameOver) {
                        _this.score += 10; // each coffee avoided is worth ten points
                        _this.textScore.text = "" + _this.score;
                    }
                });
                // add coffee to its coffeeGroup
                _this.coffeeGroup.add(coffee);
            }, this);
            timer.start();
            // display hearts based on number of lives available initially
            this.livesGroup = this.game.add.group();
            for (var i = 0; i < this.numberOfLives; i++) {
                this.livesGroup.create((i + 40) * i, 32, "heart");
            }
            this.livesGroup.reverse(); // this will make the harts disappear from right-to-left
            // add score text
            var textScoreStyle = {
                font: '4em "Segoe UI", Impact, sans-serif',
                fontWeight: "700",
                fill: "#42f45f",
                align: "center"
            };
            this.textScore = this.game.add.text(this.game.width, 0, "" + this.score, textScoreStyle);
            this.textScore.anchor.setTo(1, 0);
            // add WASD controls
            this.controlKeys = this.game.input.keyboard.addKeys({ "left": Phaser.KeyCode.A, "right": Phaser.KeyCode.D });
            // add oncscreen controls to the screen, but only if touch is available
            if (this.game.device.touch) {
                this.leftButton = this.game.add.button(40, 380, "leftButton", null, this);
                this.leftButton.fixedToCamera = true;
                this.leftButton.alpha = 0.4;
                this.leftButton.events.onInputDown.add(function () {
                    _this.isLeftButtonPressed = true;
                });
                this.leftButton.events.onInputUp.add(function () {
                    _this.isLeftButtonPressed = false;
                });
                this.rightButton = this.game.add.button(this.game.width - 40, 380, "rightButton", null, this);
                this.rightButton.anchor.x = 1;
                this.rightButton.fixedToCamera = true;
                this.rightButton.alpha = 0.4;
                this.rightButton.events.onInputDown.add(function () {
                    _this.isRightButtonPressed = true;
                });
                this.rightButton.events.onInputUp.add(function () {
                    _this.isRightButtonPressed = false;
                });
            }
            // add gamepad controls support for XBOX 360 controller
            this.game.input.gamepad.start();
            this.pad1 = this.game.input.gamepad.pad1;
        };
        /*
         * used for controlling the player's movement, left or right
         */
        GameState.prototype.controlPlayer = function (direction) {
            // if the player is dead or if switching to another state, then don't accept keypress
            if (this.isGameOver) {
                return;
            }
            if (direction === IHateCoffee.Direction.Left) {
                this.player.body.velocity.x = -GameState.MOVEMENT_VELOCITY;
            }
            else if (direction === IHateCoffee.Direction.Right) {
                this.player.body.velocity.x = GameState.MOVEMENT_VELOCITY;
            }
        };
        /*
         * we'll just poll for keyboard input to control the player using the keys object
         */
        GameState.prototype.pollControllInput = function () {
            if (this.controlKeys.left.isDown || this.isLeftButtonPressed) {
                this.controlPlayer(IHateCoffee.Direction.Left);
            }
            else if (this.controlKeys.right.isDown || this.isRightButtonPressed) {
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
        };
        GameState.prototype.coffeePlayerCollisionCallback = function (player, coffee) {
            var tween = this.game.add.tween(coffee.scale).to({ x: 0, y: 0 }, 200, "Linear", true);
            tween.onComplete.add(function () {
                coffee.kill();
            }, this, 0, coffee);
            // disable coffe's body
            coffee.body.enable = false;
            // remove a heart and decrement the lives counter
            if (this.livesGroup.getFirstAlive()) {
                var firstHeart_1 = this.livesGroup.getFirstAlive();
                var heartTween = this.game.add.tween(firstHeart_1.scale).to({ x: 0, y: 0 }, 300, "Linear", true);
                heartTween.onComplete.add(function () {
                    firstHeart_1.kill();
                }, this, 0, firstHeart_1);
                this.numberOfLives--;
            }
            // play the hit animation and sound
            this.hitAnimation.play(10);
            this.hitSound.play();
        };
        GameState.prototype.update = function () {
            var _this = this;
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
                    var gameOverText = this.game.add.text(this.game.camera.width / 2, this.game.camera.height / 2, "Game Over!\nScore: " + this.score, {
                        font: '5em "Segoe UI", Impact, sans-serif',
                        fontWeight: "600",
                        fill: "#42f45f",
                        align: "center"
                    });
                    gameOverText.anchor.setTo(0.5, 0.5);
                    gameOverText.alpha = 0.90;
                    this.textScore.kill();
                    // display restart arrow that restarts the game
                    var restartButton = this.game.add.button(this.game.camera.width / 2, 0, "restartArrow", function () {
                        _this.game.state.start("PreloadState", true, true);
                    }, this);
                    restartButton.scale.setTo(0.4, 0.4);
                    ;
                    restartButton.anchor.setTo(0.5, 0.5);
                    restartButton.y = gameOverText.bottom + restartButton.height;
                    // make it rotate
                    this.game.add.tween(restartButton).to({ rotation: (restartButton.rotation + 6.28) * -1 }, 2500, null, true, 0, -1);
                }
            }
        };
        return GameState;
    }(Phaser.State));
    // input
    GameState.MOVEMENT_VELOCITY = 350;
    GameState.DIFFICULTY_EASY = 400;
    GameState.DIFFICULTY_MEDIUM = GameState.DIFFICULTY_EASY * 0.35 + GameState.DIFFICULTY_EASY;
    GameState.DIFFICULTY_HARD = GameState.DIFFICULTY_EASY * 0.66 + GameState.DIFFICULTY_EASY;
    IHateCoffee.GameState = GameState;
    var Game = (function () {
        function Game() {
            this.game = new Phaser.Game(800, 600, Phaser.AUTO, "phaser");
            /* The boot state will contain an init() for the scale manager and will load the loading screen,
             * while the preloader will display the loading screen and load assets and then start the main game state.
             */
            this.game.state.add("BootState", BootState, true);
            this.game.state.add("MainMenuState", MainMenuState);
            this.game.state.add("PreloadState", PreloadState);
            this.game.state.add("GameState", GameState);
        }
        return Game;
    }());
    IHateCoffee.Game = Game;
})(IHateCoffee || (IHateCoffee = {}));
window.onload = function () {
    var game = new IHateCoffee.Game();
};
