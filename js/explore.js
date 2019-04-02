class Explore {
    constructor(game) {
        this.game = game;
    }

    start() {

    }

    onGameClick(event) {
        if (this.game.stage) {
            this.game.stage.checkForTileClick(event.data);
        }
    }

    onForegroundClick(event) {
        // ui 클릭을 만들어야 한다
    }

    update() {

    }
}