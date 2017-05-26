var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/*
 * Template
 */
var GameModuleName;
(function (GameModuleName) {
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
            // Set background color
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
    GameModuleName.BootState = BootState;
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
        };
        PreloadState.prototype.create = function () {
            this.game.state.start("GameState");
        };
        return PreloadState;
    }(Phaser.State));
    GameModuleName.PreloadState = PreloadState;
    /*
     * The main game running state
     */
    var GameState = (function (_super) {
        __extends(GameState, _super);
        function GameState() {
            return _super.call(this) || this;
        }
        GameState.prototype.create = function () {
        };
        GameState.prototype.update = function () {
        };
        return GameState;
    }(Phaser.State));
    GameModuleName.GameState = GameState;
    var Game = (function () {
        function Game() {
            this.game = new Phaser.Game(550, 550, Phaser.AUTO, "phaser");
            /* The boot state will contain an init() for the scale manager and will load the loading screen,
             * while the preloader will display the loading screen and load assets and then start the main game state.
             */
            this.game.state.add("BootState", BootState, true);
            this.game.state.add("PreloadState", PreloadState);
            this.game.state.add("GameState", GameState);
        }
        return Game;
    }());
    GameModuleName.Game = Game;
})(GameModuleName || (GameModuleName = {}));
window.onload = function () {
    var game = new GameModuleName.Game();
};
