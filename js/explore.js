class Explore {
    constructor(game) {
        this.game = game;
    }

    prepare() {
        // 플레이어를 맵에 추가한다
        // 맵에 스타팅 포인트가 있어야 하는데? 
        
        const spawnPoint = { x: 3, y: 1 };

        const stage = this.game.stage
        const player = this.game.player;
        stage.addCharacter(player, spawnPoint.x, spawnPoint.y);
        stage.checkForFollowCharacter(player, true);

        // 캐릭터 방향을 돌린다
        this.game.player.changeVisualToDirection(DIRECTIONS.SE);

        // 컷신준비를 한다
        this.cutscene = true;
        this.game.ui.showTheaterScreen(0);
        this.game.stage.showPathHighlight = false;

        this.game.stage.onTouchObject = this.onTouchObject.bind(this);
    }

    start() {
        this.game.stage.onTileSelected = this.onTileSelected.bind(this);
        
        //=======================
        // 컷신 하드코딩
        // 스테이지 이름을 화면에 출력한다
        this.game.ui.showStageTitle("어둠의 성탑 99층");
        // 플레이어를 적당한 곳으로 이동시킨다
        this.game.stage.moveCharacter(this.game.player, 4,4);
        setTimeout(() => {
            // 게이트문을 찾아서 닫는다.
            const gate = this.game.stage.getObjectAt(3, 1);
            this.game.tweens.addTween(gate, 0.5, { openRatio: 1 }, 0, "easeInOut", true);
        }, 2000);

        setTimeout(() => {
            // 컷신을 끝낸다
            this.cutscene = false;
            this.game.ui.hideTheaterScreen(1);
            this.game.stage.showPathHighlight = true;
        }, 3000);
    }

    onGameClick(event) {
        if (this.cutscene) {
            // 컷신중에는 입력을 막는다.
            event.stopped = true;
            return;
        }

        if (this.game.stage) {
            this.game.stage.checkForTileClick(event.data);
        }
    }

    onTouchObject(obj) {
        if (obj) {
            obj.touch(this.game);
        }
    }

    onForegroundClick(event) {
        // ui 클릭을 만들어야 한다
    }

    onTileSelected(x, y) {
        // 해당 타일이 이동가능한 타일인가?
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