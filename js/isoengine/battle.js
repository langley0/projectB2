
// 전투 씬을 구성하고 싸우게 한다
class Battle {
    constructor(engine, player) {
        this.engine = engine;
        this.player = player;

        this.movies = [];
    }

    prepare() {
        // 적절한 위치에 배치를 한다
        this.engine.moveCharacter(this.player, 6, 6);

        // 적을 추가한다
        const enemy = new Engine.Character();
        this.engine.addCharacter(enemy, 12, 6);
        this.enemy = enemy;
        
        const backup = this.engine.onTileSelected;
        this.engine.onTileSelected = null;

        // 스케일을 변경한다
        this.engine.zoomTo(2);
        //this.engine.moveEngine.addTween(this.engine.mapContainer.scale, 1, { x: 2, y: 2 }, 0, "easeInOut", true );
    
        //this.engine.mapContainer.scale.x = 2;
        //this.engine.mapContainer.scale.y = 2;
    }

    start() {
        // 전투를 시작한다
        // 해당 플레이어의 턴을 실행한다
        requestAnimationFrame(this.update.bind(this));

        this.turnCount = 0;
        this.nextTurn();
    }

    nextTurn() {
        ++this.turnCount;
        if (this.turnCount % 2 === 1) {
            this.turn(this.player, this.nextTurn.bind(this));
        } else {
            this.turn(this.enemy, this.nextTurn.bind(this));
        }
    }

    turn(character, onEndTurn) {
        // 턴이 종료되면 callback 을 부른다
        // 사용자의 입력을 기다린다
        this.waitCommand(character, (command) => {
            if (command === "attack" ) {
                // 공격을 한다
                // 상대를 향해 조금 이동을 하고 
                // 이동이 끝나면 공격 모션을 플레이한다
                // 모든 것이 끝나면 턴종료를 한다
                const opponent = (character === this.player) ? this.enemy : this.player;

                const start = { x: character.position.x, y: character.position.y };
                const to = { x: (opponent.position.x - character.position.x) / 5 + character.position.x, y: (opponent.position.y - character.position.y) / 5 + character.position.y };

                const movieClip = new MovieClip(
                    MovieClip.Timeline(1, 1, null, () => {
                        // 준비동작을 한다
                    }),
                    MovieClip.Timeline(1, 30, character, [
                        ["x", start.x, to.x, "outCubic"],
                        ["y", start.y, to.y, "outCubic"]]),
                    MovieClip.Timeline(31, 31, null, () => {
                        // 공격모션을 플레이한다
                        character.setAnimation('attack_' + getDirectionName(character.currentDir))
                        character.anim.loop = false;
                    }),
                    MovieClip.Timeline(91, 91, null, () => {
                        // 히트이펙트를 추가한다
                        this.hitEffect(opponent, 123);
                    }),
                    MovieClip.Timeline(111, 111, null, () => {
                        // 다시 준비동작을 한다
                        character.setAnimation('idle_' + getDirectionName(character.currentDir))
                        character.anim.loop = true;
                    }),
                    MovieClip.Timeline(111, 140, character, [
                        ["x", to.x, start.x, "outCubic"],
                        ["y", to.y, start.y, "outCubic" ]]),
                    MovieClip.Timeline(141, 141, null, () => {
                        setTimeout(onEndTurn, 1);
                    }),
                );
                this.movies.push(movieClip);
                movieClip.playAndStop(); // 이것을 기본으로 한다..


                
            }
        })
    }

    waitCommand(character, onCommandCallback) {
        onCommandCallback("attack");
    }

    hitEffect(target, damage) {
        const style = new PIXI.TextStyle();
        style.dropShadow = true;
        style.dropShadowDistance = 3;
        style.fontStyle = 'italic';
        style.fontWeight = 'bold';
        style.fontSize = 20;
        style.fill = "#ffffff";
        const text = new PIXI.Text('' + damage , style);
        text.anchor.x = 0.5;
        text.position.y = -24;
        text.alpha = 0;
        target.addChild(text);
        
        // 페이드인하면서 위로 조금 올라온다
        const movieClip = new MovieClip(
            MovieClip.Timeline(1, 30, text, [["alpha", 0, 1, "outCubic"]]),
            MovieClip.Timeline(1, 30, text, [["y", -24, -36, "outCubic"]]),
            MovieClip.Timeline(61, 91, text, [["alpha", 1, 0, "outCubic"]]),
            MovieClip.Timeline(91, 91, null, () => {
                target.removeChild(text);
            }),
        );
        this.movies.push(movieClip);
        movieClip.playAndStop(); // 이것을 기본으로 한다..
                
    }

    update() {
        let len = this.movies.length;
        for (let i=0; i < len; i++) {
            const movie = this.movies[i];
            movie.update();
            if (!movie._playing) {
                this.movies.splice(i, 1);
                i--; len--;
            }
        }
        requestAnimationFrame(this.update.bind(this));
    }

    waitCommant
}