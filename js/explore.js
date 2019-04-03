class Explore {
    constructor(game) {
        this.game = game;
    }

    prepare() {
        // 플레이어를 맵에 추가한다
        // 맵에 스타팅 포인트가 있어야 하는데? 
        
        const spawnPoint = { x: 4, y: 4 };

        const stage = this.game.stage
        const player = this.game.player;
        stage.addCharacter(player, spawnPoint.x, spawnPoint.y);
        stage.checkForFollowCharacter(player, true);
    }

    start() {
        this.game.stage.onTileSelected = this.onTileSelected.bind(this);

        // 스테이지 이름을 화면에 출력한다
        this.game.ui.showStageTitle("스테이지 이름");
    }

    onGameClick(event) {
        if (this.game.stage) {
            this.game.stage.checkForTileClick(event.data);
        }
    }

    onForegroundClick(event) {
        // ui 클릭을 만들어야 한다
    }

    onTileSelected(x, y) {
        const target =  this.game.stage.getObjectAt(x, y);
        this.target = target;
        // 해당 타일에 무엇이 있는지 확인한다
        // 목표에 도착했을때 타겟에 대한 인터랙션을 어떻게 하지?

        // 이동 루틴을 다시 만들어야 한다
        // 타겟이 있을때에는 타겟을 제외한 패스가 만들어졌을때 마지막 패스끝에 타겟 인터랙션을 달아야 한다.
        // 패스가 만들어지지 않으면, 타겟팅을 지정하지 않고 근접한 곳까지 이동한다
        this.game.stage.moveCharacter(this.game.player, x, y);
    }

    update() {
        
    }
}