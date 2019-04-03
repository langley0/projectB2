class Game {
    constructor(width, height) {
        const pixi = new PIXI.Application(width, height, { backgroundColor : 0x6BACDE, forceCanvas: true });
        document.body.appendChild(pixi.view);
        this.pixi = pixi;

        // 렌더링 레이어를 설정한다
        this.background = new PIXI.Container();
        this.gamelayer = new PIXI.Container(); // 게임용
        this.foreground = new PIXI.Container(); // UI 

        pixi.stage.addChild(this.background);
        pixi.stage.addChild(this.gamelayer);
        pixi.stage.addChild(this.foreground);

        // 클릭 이벤트
        this.gamelayer.mouseup = this.onGameClick.bind(this);
        this.gamelayer.interactive = true;

        this.foreground.mouseup = this.onForegroundClick.bind(this);
        this.foreground.interactive = true;
        
        // 암전용 블랙스크린을 설치한다
        const blackScreen = new PIXI.Sprite(PIXI.Texture.WHITE);
        blackScreen.width = width + 128;
        blackScreen.height = height + 128;
        blackScreen.position.x = -64;
        blackScreen.position.y = -64;
        blackScreen.tint = 0;
        pixi.stage.addChild(blackScreen);
        this.blackScreen = blackScreen;

        // 암전용 블루어 필터를 설치한다
        const blurFilter = new PIXI.filters.BlurFilter(32);
        pixi.stage.filters = [blurFilter];
        this.blur = blurFilter;

        this.tweens = new Tweens();
        this.battleMode = new Battle(this);
        this.exploreMode = new Explore(this);
        this.currentMode = null;
        this.nextStageMode = null;
    }

    preload(resources, onComplete) {
        // TODO : 나중에 로딩 루틴을 하나로 통일 하여야 한다. 지금은 같은 코드의 중복이 너무 심하다
        const loader = new PIXI.loaders.Loader();
        for (const res of resources) {
            if (Array.isArray(res)) {
                if (!PIXI.utils.TextureCache[res[0]] && !PIXI.utils.BaseTextureCache[res[0]]) {
                    loader.add(...res);
                }
            } else {
                const texturePackName = res + '_image';
                if (!PIXI.utils.TextureCache[res] && !PIXI.utils.BaseTextureCache[res] && 
                    !PIXI.utils.TextureCache[texturePackName] && !PIXI.utils.BaseTextureCache[texturePackName]) {
                    loader.add(res);
                }
            }
        }

        loader.load((_, result) => {
            if (onComplete) {
                onComplete(result);
            }
        });
    }

    start(playerInfo) {
        // 플레이어 정보를 네트워크나 디스크로부터 읽어온 직후이다.
        // 플레이어가 어디에 위치 했는지 확인한다.
        // 플레이어 캐릭터를 만든다
        this.loadCharacter(() => {
            this.player = new Engine.Character();
            // 플레이어가 속한 스테이지 들어간다
            this.enterStage(playerInfo.stagePath, "explore");
        });
    }

    loadCharacter(onLoadComplete) {
        const resources = [
            "assets/night/atk_left.json",
            "assets/night/atk_up.json",
            "assets/night/idle.json",
            "assets/night/idle_up.json",
            "assets/night/walk_down.json",
            "assets/night/walk_up.json",
            ["shadow.png", "assets/shadow.png"],
        ];

        const loader = new PIXI.loaders.Loader();
        for (const res of resources) {
            if (Array.isArray(res)) {
                if (!PIXI.utils.TextureCache[res[0]] && !PIXI.utils.BaseTextureCache[res[0]]) {
                    loader.add(...res);
                }
            } else {
                const texturePackName = res + '_image';
                if (!PIXI.utils.TextureCache[res] && !PIXI.utils.BaseTextureCache[res] && 
                    !PIXI.utils.TextureCache[texturePackName] && !PIXI.utils.BaseTextureCache[texturePackName]) {
                    loader.add(res);
                }
            }
        }

        loader.load((_, resources) => { 
            if (onLoadComplete) {
                onLoadComplete();
            }
        });
    }

    loadStage(stagePath, onLoadComplete) {
        // 필요한 리소스를 로딩한다
        const resources = [
            ["tiles.json", "assets/mapdata/tiles.json"],
            ["tiles.png", "assets/mapdata/tiles.png"],
            ["objects.json", "assets/mapdata/objects.json"],
            ["objects.png", "assets/mapdata/objects.png"],
            ["walls.json", "assets/mapdata/walls.json"],
            ["walls.png", "assets/mapdata/walls.png"],
            ["map.json", "assets/mapdata/map.json"],
            ["windowlight.png", "assets/windowlight.png"],
        ];

        const loader = new PIXI.loaders.Loader();
        // 스테이지 기본 데이터
        loader.add("stage", stagePath);

        // 추가리소르를 로딩한다
        for (const res of resources) {
            if (Array.isArray(res)) {
                if (!PIXI.utils.TextureCache[res[0]] && !PIXI.utils.BaseTextureCache[res[0]]) {
                    loader.add(...res);
                }
            } else {
                const texturePackName = res + '_image';
                if (!PIXI.utils.TextureCache[res] && !PIXI.utils.BaseTextureCache[res] && 
                    !PIXI.utils.TextureCache[texturePackName] && !PIXI.utils.BaseTextureCache[texturePackName]) {
                    loader.add(res);
                }
            }
        }


        loader.load((_, resources) => { 
            const mapData = resources["stage"].data; // 이것은 규칙을 정한다
            const stage = new Engine.IsoMap(mapData.width, mapData.height, mapData.tilewidth, mapData.tileheight);

            // 타일셋을 먼저 등록한다
            for (const tileset of mapData.tilesets) {
                const tiles = resources[tileset.source].data;
                const prefix = tileset.source.replace('.json', '_');
                const idStart = tileset.firstgid;

                for (let i = 0; i < tiles.tilecount; ++i) {

                    const textureName = prefix + i + ".png";
                    if (!PIXI.utils.TextureCache[textureName]) {

                        const image = resources[tiles.image].data;

                        const x = i % tiles.columns;
                        const y = Math.floor(i / tiles.columns);
                        const c = document.createElement('canvas');
                        c.width = tiles.tilewidth + 2; 
                        c.height = tiles.tileheight + 2;
                        const context = c.getContext('2d');
                        context.drawImage(image, x * tiles.tilewidth, y * tiles.tileheight, tiles.tilewidth, tiles.tileheight, 1, 0, tiles.tilewidth, tiles.tileheight);
                        context.drawImage(image, x * tiles.tilewidth, y * tiles.tileheight, tiles.tilewidth, tiles.tileheight, 1, 2, tiles.tilewidth, tiles.tileheight);
                        context.drawImage(image, x * tiles.tilewidth, y * tiles.tileheight, tiles.tilewidth, tiles.tileheight, 0, 1, tiles.tilewidth, tiles.tileheight);
                        context.drawImage(image, x * tiles.tilewidth, y * tiles.tileheight, tiles.tilewidth, tiles.tileheight, 2, 1, tiles.tilewidth, tiles.tileheight);
                        context.drawImage(image, x * tiles.tilewidth, y * tiles.tileheight, tiles.tilewidth, tiles.tileheight, 1, 1, tiles.tilewidth, tiles.tileheight);
                        const texture = PIXI.Texture.fromCanvas(c, new PIXI.Rectangle (1, 1, tiles.tilewidth, tiles.tileheight));
                        PIXI.Texture.addToCache(texture, textureName);
                    }
                    stage.addTile(i+idStart, textureName); // 나중에 타일매니져로 교체한다
                }
            }

            // 타일맵을 설정한다
            for (const layer of mapData.layers) {
                for (let y = 0; y < layer.height;++y) {
                    for (let x = 0; x < layer.width;++x) {
                        // 90 도 회전시킨다.
                        const index =  y + (layer.width - x -1)* layer.width;
                        if (layer.name === "Tiles") {
                            // 타일
                            stage.setGroundTile(x, y, layer.data[index]);
                        } else {
                            // 오브젝트이다
                            stage.setObjectTile(x, y, layer.data[index]);
                        }
                    }
                }
            }

            // 렌더링 데이터를 빌드한다
            stage.build();

            // 로딩 완료 콜백
            if (onLoadComplete) {
                onLoadComplete(stage);
            }
        });
    }

    enterStage(stagePath, mode) {
        this.nextStageMode = mode;
        if (this.stage) {
            // 기존 스테이지에서 나간다
            this.tweens.addTween(this.blur, 1, { blur: 32 }, 0, "easeIn", true );
            this.tweens.addTween(this.blackScreen, 1, { alpha: 1 }, 0, "easeIn", true, () => {
                this.gamelayer.removeChildren();
                
                
                // 화면 암전이 끝나면 로딩을 시작한다
                this.loadStage(stagePath, this.onStageLoadCompleted.bind(this));
            });
        } else {
            // 바로 로딩을 한다
            this.loadStage(stagePath, this.onStageLoadCompleted.bind(this));
        }
    }

    onStageLoadCompleted(stage) {
        // 플레이어를 맵에 추가한다
        // 맵에 스타팅 포인트가 있어야 하는데? 
        const spawnPoint = { x: 4, y: 4 };
        const zoomLevel = 2;

        stage.addCharacter(this.player, spawnPoint.x, spawnPoint.y);
        stage.checkForFollowCharacter(this.player, true);
        stage.onTileSelected = (x, y) => {
            // 캐릭터를 옮긴다
            stage.moveCharacter(this.player, x, y);
        };
        

        // 스테이지의 줌레벨을 결정한다
        stage.zoomTo(zoomLevel, true);

        this.stage = stage;
        this.gamelayer.addChild(stage);
    

        // 다시 암전을 밝힌다
        this.tweens.addTween(this.blur, 1, { blur: 0 }, 0, "easeOut", true );
        this.tweens.addTween(this.blackScreen, 1, { alpha: 0 }, 0, "easeOut", true, () => {
            // 페이드 인이 끝나면 게임을 시작한다
            if (this.nextStageMode === "battle") {
                this.currentMode = this.battleMode;
            } else {
                this.currentMode = this.exploreMode;
            }
            this.nextStageMode = null;
            this.currentMode.start();
        });
    }

    onGameClick(event) {
        if (this.currentMode && this.currentMode.onGameClick) {
            this.currentMode.onGameClick(event);
        }
    }

    onForegroundClick(event) {
        if (this.currentMode && this.currentMode.onForegroundClick) {
            this.currentMode.onGameClick(event);
        }
    }

    update() {
        this.tweens.update();
        if (this.stage) {
            this.stage.update();
        }
        if (this.currentMode) {
            this.currentMode.update();
        }
    }
}