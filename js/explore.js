class Explore {
    constructor(game) {
        this.game = game;
    }

    prepare() {
        // 플레이어를 맵에 추가한다
        // 맵에 스타팅 포인트가 있어야 하는데? 

        if (this.fromBattle) {
            // 전투에서 되돌아 올때는 따로 연출없이 바로 온다
            const stage = this.game.stage
            const player = this.game.player;
            stage.addCharacter(player, this.backupX, this.backupY);
            stage.checkForFollowCharacter(player, true);
            player.setUiVisible(this.game, false);
            
        } else {
            const spawnPoint = { x: 3, y: 1 };

            const stage = this.game.stage
            const player = this.game.player;
            stage.addCharacter(player, spawnPoint.x, spawnPoint.y);
            stage.checkForFollowCharacter(player, true);
            player.setUiVisible(this.game, false);

            // 캐릭터 방향을 돌린다
            this.game.player.changeVisualToDirection(DIRECTIONS.SE);

            // 컷신준비를 한다
            this.cutscene = true;
            this.game.ui.showTheaterScreen(0);
            this.game.stage.showPathHighlight = false;

            this.game.stage.onTouchObject = this.onTouchObject.bind(this);
            this.game.stage.onTilePassing = this.onTilePassing.bind(this);

            // 게이트를 열어놓는다
            const gate = this.game.stage.getObjectAt(3, 1);
            gate.open();
        }
    }

    start() {
        this.game.stage.onTileSelected = this.onTileSelected.bind(this);

        if (this.fromBattle) {
            // 바로 컷신을 끝낸다
        } else {
            //=======================
            // 컷신 하드코딩
            // 스테이지 이름을 화면에 출력한다
            this.game.ui.showStageTitle("어둠의 성탑 99층");
            // 플레이어를 적당한 곳으로 이동시킨다
            this.game.stage.moveCharacter(this.game.player, 4,4);
            setTimeout(() => {
                // 게이트문을 찾아서 닫는다.
                const gate = this.game.stage.getObjectAt(3, 1);
                gate.close(this.game.tweens);
            }, 2000);

            setTimeout(() => {
                this.game.ui.showChatBallon(this.game.player, "큰일이다 문이 닫혔다!\n어떻게 하면 나갈 수 있을까 ...", 4);
                // 컷신을 끝낸다
                this.cutscene = false;
                this.game.ui.hideTheaterScreen(1);
                this.game.stage.showPathHighlight = true;
            }, 3000);
        }
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

    onTilePassing(obj) {
        if (obj === this.game.player) {
            if (obj.gridX === 18 && (obj.gridY === 15 || obj.gridY === 16)) {
                // 컷신을 튼다
                this.cutscene = true;
                this.game.ui.showTheaterScreen(1);
                this.game.stage.showPathHighlight = false;

                this.game.player.changeVisualToDirection(DIRECTIONS.SE);

                // 1초후에 대사를 하고 
                setTimeout(() => {
                    this.game.ui.showChatBallon(this.game.player, "이 게임에서 드디어 탈출이다. 집에가자", 4);
                }, 500)
                
                
                // 다시 1초후에 화면을 암전하고 엔딩크레딧을 보여준다
                setTimeout(() => {
                    const sprite = new PIXI.Sprite(PIXI.Texture.fromFrame("ending.png"));
                    this.game.ui.addChild(sprite);
                    sprite.alpha = 0;
                    this.game.tweens.addTween(sprite, 1, { alpha: 1 }, 0, "easeIn", true);
                }, 2000);


                

                // 플레이어의 이동을 멈춘다
                // TODO : 기타게임 상태를 정리하여야 한다. 어떻게 할 지 고민하고 코드를 정리해보자.
                return true;
            }
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