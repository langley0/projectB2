
// 전투 씬을 구성하고 싸우게 한다
class Battle {
    constructor(game) {
        this.game = game;
        this.callback = null;

        this.movies = [];
    }

    prepare() {
        const stage = this.game.stage;

        this.players = [];
        this.enemies = [];

        this.loadCharacter();

        this.cutscene = true;
        this.game.ui.showTheaterScreen(0);
        this.game.ui.battleUi.setBattleUi(this.players, this.enemies);
        this.game.stage.focusBattleCenter();

        stage.onTileSelected = null;
    }

    setBattleEndCallback(callback) {
        this.callback = callback;
    }

    start() {
        this.battleIntro();
    }

    loadCharacter() {
        const spawnPoint = { x: 6, y: 7 };

        // 하드코딩 수정할 것. (파티의 개념이 어딘가에 있어야 할 것 같고.. enemies를 어디서 어떻게 불러올까.. 우선 하드코딩)
        const player = new Engine.Wizard();
        this.players.push(player);
        this.game.stage.addCharacter(player, spawnPoint.x, spawnPoint.y - 2);
        player.changeVisualToDirection(Engine.DIRECTIONS.NE);

        const player_2 = new Engine.Archer();
        this.players.push(player_2);
        this.game.stage.addCharacter(player_2, spawnPoint.x, spawnPoint.y);
        player_2.changeVisualToDirection(Engine.DIRECTIONS.NE);

        const player_3 = new Engine.Knight();
        this.players.push(player_3);
        this.game.stage.addCharacter(player_3, spawnPoint.x, spawnPoint.y + 2);
        player_3.changeVisualToDirection(Engine.DIRECTIONS.NE);

        // 적을 추가한다
        const enemy = new Engine.Medusa();
        this.game.stage.addCharacter(enemy, 12, 5);
        this.enemies.push(enemy);

        // 적을 추가한다
        const enemy_2 = new Engine.Troll();
        this.game.stage.addCharacter(enemy_2, 12, 7);
        this.enemies.push(enemy_2);

        // 적을 추가한다
        const enemy_3 = new Engine.Wolf();
        this.game.stage.addCharacter(enemy_3, 12, 9);
        this.enemies.push(enemy_3);
    }

    battleIntro() {
        var flow = 0;

        // Intro Cutscene (하드코딩 수정할 것..) 캐릭터별 대사가 있을것이고.. 캐릭터 배열이 있을테니 추후 하드코딩 수정할것
        var intro = () => {
            if (flow == 0) {
                this.game.stage.focusBattleObject(this.enemies[1]);
                setTimeout(() => {
                    this.game.ui.showChatBallon(this.enemies[1], "인간 냄새가 나는군..");
                }, 550);
            } else if (flow == 1) {
                this.game.stage.focusBattleObject(this.players[2]);
                setTimeout(() => {
                    this.game.ui.showChatBallon(this.players[2], "각오하라고!!");
                }, 550);
            } else if (flow == 2) {
                this.cutscene = false;
                this.game.ui.hideTheaterScreen(1);
                this.game.stage.focusBattleCenter();
                this.game.ui.battleUi.showUi();
                this.players.forEach((player) => {
                    // this.game 넘기는 것 수정.
                    player.setUiVisible(this.game, true);
                });
                this.enemies.forEach((enemy) => {
                    enemy.setUiVisible(this.game, true);
                })
            }

            setTimeout(() => {
                if (flow === 2) {
                    this.turnCount = 0;
                    this.nextTurn();
                } else {
                    flow++;
                    intro();
                }
            }, 1200);
        }

        intro();
    }

    nextTurn() {
        // 양측 살아있는 인원조사
        let enemiesLength = 0;
        this.enemies.forEach((enemy) => {
            if (enemy.hp > 0) {
                enemiesLength++;
            }
        });

        let playerLength = 0;
        this.players.forEach((player) => {
            if (player.hp > 0) {
                playerLength++;
            }
        });

        if (enemiesLength === 0) {
            this.gameEnd();
        } else if (playerLength === 0) {
            this.gameEnd();
        } else if (this.turnCount % 4 === 0) {
            // 사용자 턴 양측 tint 조정.
            this.game.ui.showStageTitle("Player's Turn");

            this.players.forEach((player) => {
                if (player.hp > 0) {
                    player.status = 'idle';
                    player.anim.tint = 0xFFFFFF;
                }
            });

            this.enemies.forEach((enemy) => {
                enemy.anim.tint = 0xBBBBBB;
            });

            setTimeout(() => {
                this.turnCount = 1;
                this.nextTurn();
            }, 1000);
        } else if (this.turnCount % 4 === 1) {
            let index = -1;
            this.players.forEach((player, i) => {
                if (player.status === 'idle' && index == -1) {
                    index = i;
                }
            });

            if (index === -1) {
                this.turnCount = 2;
                this.nextTurn();
            } else {
                this.turn(this.players[index], this.nextTurn.bind(this));
            }
        } else if (this.turnCount % 4 === 2) {
            this.game.ui.showStageTitle("Enemy's Turn");

            this.enemies.forEach((enemy) => {
                if (enemy.hp > 0) {
                    enemy.status = 'idle';
                    enemy.anim.tint = 0xFFFFFF;
                }
            });

            setTimeout(() => {
                this.turnCount = 3;
                this.nextTurn();
            }, 1000);
        } else {
            let index = -1;
            this.enemies.forEach((enemy, i) => {
                if (enemy.status === 'idle' && index == -1) {
                    index = i;
                }
            });

            if (index === -1) {
                this.turnCount = 0;
                this.nextTurn();
            } else {
                this.turn(this.enemies[index], this.nextTurn.bind(this));
            }
        }
    }

    gameEnd() {
        // ending_victory
        this.game.ui.battleUi.hideUi();

        const victory = new PIXI.Sprite(PIXI.Texture.fromFrame("ending_victory.png"));
        victory.alpha = 0;
        this.game.ui.battleUi.addChild(victory);
        this.game.tweens.addTween(victory, 1, { alpha: 1 }, 1, "easeInOut", true, ()=> {
            victory.interactive = true;
            victory.mouseup = () => {
                // 스테이지 변경을 한다 그런데... 페이드 아웃되었을때에 
                this.game.enterStage('assets/mapdata/map.json', "explore");
            };
        });
    }

    // 이제 Character를 안받아도 되겠으나.. 지금 player턴인지.. enemies턴인지 알기위해 일단 둔다..
    turn(character, onEndTurn) {
        // 턴이 종료되면 callback 을 부른다
        // 사용자의 입력을 기다린다

        // 하드코딩 수정할 것..
        this.waitCommand(character, (character, command) => {
            if (command === "attack") {
                // 공격을 한다
                // 상대를 향해 조금 이동을 하고 
                // 이동이 끝나면 공격 모션을 플레이한다
                // 모든 것이 끝나면 턴종료를 한다
                let opponent;
                if (this.players.indexOf(character) >= 0) {
                    this.enemies.forEach((enemy) => {
                        if (enemy.hp > 0 && !opponent) {
                            opponent = enemy;
                        }
                    });
                } else {
                    this.players.forEach((player) => {
                        if (player.hp > 0 && !opponent) {
                            opponent = player;
                        }
                    });
                }

                character.status = 'done';

                const start = { x: character.position.x, y: character.position.y };
                const to = { x: (opponent.position.x - character.position.x) / 10 * 3 + character.position.x, y: (opponent.position.y - character.position.y) / 10 * 3 + character.position.y };

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
                        // 데미지 연산하고, 히트이펙트를 추가한다
                        // 데미지를 입었을 때, 죽음 처리를 어떻게 해야할까.... 체력은 어디서 까야하지..?
                        // 이펙트는 어디서 주는가?..
                        let damage = Math.round((character.damage * character.balance) + (Math.random() * (1 - character.balance) * character.damage) * (1 - opponent.defense));
                        let fontColor = "#FFFFFF";
                        if (Math.random() < character.ciriticalRate) {
                            fontColor = "#FF0000";
                            damage = Math.round(damage * character.ciriticalBalance);
                            opponent.onDamage(this.game, damage, { type: 'Slash', critical: true });
                        } else {
                            opponent.onDamage(this.game, damage, { type: 'Slash' });
                        }

                        this.hitEffect(opponent, damage, fontColor);
                    }),
                    MovieClip.Timeline(111, 111, null, () => {
                        // 다시 준비동작을 한다
                        character.setAnimation('idle_' + getDirectionName(character.currentDir))
                        character.anim.loop = true;
                    }),
                    MovieClip.Timeline(111, 140, character, [
                        ["x", to.x, start.x, "outCubic"],
                        ["y", to.y, start.y, "outCubic"]]),
                    MovieClip.Timeline(141, 141, null, () => {
                        character.anim.tint = 0xBBBBBB;
                        setTimeout(onEndTurn, 1);
                    }),
                );
                this.movies.push(movieClip);
                movieClip.playAndStop(); // 이것을 기본으로 한다..
            }
        })
    }

    waitCommand(character, onCommandCallback) {
        // onCommandCallback("attack");
        // opponent 변경도 필요하다..
        if (this.players.indexOf(character) >= 0) {
            // Player일경우. battle UI에서 커멘드를 받는다..
            this.game.ui.battleUi.getCommand((character, command) => {
                onCommandCallback(character, "attack");
            });
        } else {
            onCommandCallback(character, "attack");
        }
    }

    hitEffect(target, damage, color) {
        const style = new PIXI.TextStyle();
        style.dropShadow = true;
        style.dropShadowDistance = 3;
        style.fontStyle = 'italic';
        style.fontWeight = 'bold';
        style.fontSize = 20;
        style.fill = color ? color : "#ffffff";
        const text = new PIXI.Text('-' + damage, style);
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
        for (let i = 0; i < len; i++) {
            const movie = this.movies[i];
            movie.update();
            if (!movie._playing) {
                this.movies.splice(i, 1);
                i--; len--;
            }
        }
    }
}