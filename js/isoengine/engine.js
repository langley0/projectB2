var Engine = {};

class Tile extends PIXI.Container {
    constructor(x, y) {
        super();
        this.gridX = x;
        this.gridY = y;
    }

    setTexture(texture) {
        const sprite = new PIXI.Sprite(texture);
        sprite.position.y = -texture.height;
        this.addChild(sprite);

        const cover = new PIXI.Sprite(PIXI.Texture.WHITE);
        cover.width = sprite.width;
        cover.height = sprite.height;
        cover.position.y =sprite.position.y;

        cover.tint = 0;
        cover.alpha = 0;
        this.addChild(cover);

        this.cover = cover;

        this.check  =true;
    } 

    // 어떻게 해야하냐.. 고민고민
    setObject(object) {
        this.addChild(object);
    }

    removeObject(object) {
        this.removeChild(object);
    }
}


class IsoMap extends PIXI.Container {
    constructor(width, height, tileWidth, tileHeight) {
        super();

        this.mapWidth = width;
        this.mapHeight = height;
        this.tileWidth = tileWidth;
        this.tileHeight = tileHeight;
        this.TILE_HALF_W = tileWidth / 2;
        this.TILE_HALF_H = tileHeight / 2;

        this.tiles = {}
        this.groundMap = [];
        this.objectMap = [];
        // 모든 영역에 타일을 만든다
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {

                const gtile = new Tile(x, y);
                gtile.position.x = this.getTilePosXFor(x, y) - this.TILE_HALF_W;
                gtile.position.y = this.getTilePosYFor(x ,y) + this.TILE_HALF_H;
                this.groundMap.push(gtile);

                const otile = new Tile(x, y);
                otile.position.x = this.getTilePosXFor(x, y) - this.TILE_HALF_W;
                otile.position.y = this.getTilePosYFor(x ,y) + this.TILE_HALF_H;
                this.objectMap.push(otile);
            }
        }

        this.groundContainer = new PIXI.Container();
        this.objectContainer = new PIXI.Container()

        this.addChild(this.groundContainer);
        this.addChild(this.objectContainer);

        this.mousedown = this.touchstart = this.onMouseDown.bind(this);
	    this.mousemove = this.touchmove = this.onMouseMove.bind(this);
        this.mouseup = this.mouseupout = this.touchend = this.onMouseUp.bind(this);
        this.interactive = true;

        this.entities = {};
    }

    addTile(id, textureName) {
        this.tiles[id] =  textureName;
    }

    setGroundTile(x, y, tileId) {
        if (tileId > 0) {
            const tile = this.groundMap[x + y * this.mapWidth];
            tile.setTexture(this.getTileTexture(tileId));
        }
    }

    setObjectTile(x, y, tileId) {
        if (tileId > 0) {
            const tile = this.objectMap[x + y * this.mapWidth];
            tile.setTexture(this.getTileTexture(tileId));
        }
        
    }

    getTilePosXFor = function(c, r) {
        return (c * this.TILE_HALF_W) + (r * this.TILE_HALF_W);
    };

    getTilePosYFor = function(c, r) {
        return (r * this.TILE_HALF_H) - (c * this.TILE_HALF_H);
    };

    getTileTexture(tileid) {
        const src = this.tiles[tileid];
        if (src) {
            return PIXI.Texture.fromFrame(src);
        } else {
            return null;
        }
    }

    build() {
        for (let y = 0; y < this.mapHeight; y++ ) {
            for (let x = this.mapWidth - 1; x >= 0; --x) {
                const index = x + y * this.mapWidth;
                const groundTile = this.groundMap[index];
                if (groundTile) {
                    this.groundContainer.addChild(groundTile);
                }

                const objectTile = this.objectMap[index];
                if (objectTile) {
                    this.objectContainer.addChild(objectTile);
                }
            }
        }
    }

    onMouseDown(event) {
    }

    onMouseMove(event) {
    }

    onMouseUp(event) {
        this.checkForTileClick(event.data);
    }

    checkForTileClick(mdata) {
        const localPoint = this.toLocal(mdata.global);
        const selectedTile = this.getTileFromLocalPos(localPoint);
        if (selectedTile) {
           if (this.onTileSelected) {
                this.onTileSelected(selectedTile.gridX, selectedTile.gridY);
           }
        }
    }

    getTileFromLocalPos(point) {
        // 화면의 좌표를 구하는 방식을 역산한다.
        // 중앙 센터포지션을 중심으로 바닥 타일을 감싸는 사각형을 그린다
        // 이 사각형들은 겹쳐있기 때문에 여러개의 중첩되어서 나오게 된다.
        // 이 중첩된 사각형중에 하나를 찾으면 된다.

        // 찾기 귀찮으니 모든 타일을 검사하자..
        for (let y = 0; y < this.mapHeight; ++y) {
            for (let x = 0; x < this.mapWidth; ++x) {
                // 중앙 포지션을 구한다
                const cx = this.getTilePosXFor(x, y);
                const cy = this.getTilePosYFor(x ,y);

                if (cx - this.TILE_HALF_W <= point.x && point.x < cx + this.TILE_HALF_W && 
                    cy - this.TILE_HALF_H <= point.y && point.y < cy + this.TILE_HALF_H) {

                    // 타일마름모 안에 있는지 확인한다
                    if (Math.abs(point.x - cx) * this.TILE_HALF_H / this.TILE_HALF_W + Math.abs(point.y - cy) <= this.TILE_HALF_H) {
                        const index = x + y * this.mapWidth;
                        return this.groundMap[index];
                    }
                }
            }
        }
        return null;
    }

    addCharacter(character, x, y) {
        // 해당 좌표에 오브젝트를 추가한다
        // 오브젝트가 없는 곳에만 오브젝트를 추가할수 있다 (현재는)
        
        const index = x + y * this.mapWidth;
        const objectTile = this.objectMap[index];
        if (objectTile) {
            objectTile.setObject(character);
            character.gridX = x;
            character.gridY = y;
            this.entities[character.id] = character;
        }
    }

    moveCharacter(character, x, y) {
        const oldIndex =  character.gridX + character.gridY * this.mapWidth;
        const newIndex = x + y * this.mapWidth;
        const oldTile = this.objectMap[oldIndex];
        const newTile = this.objectMap[newIndex];

        oldTile.removeObject(character);
        newTile.setObject(character);

        character.gridX = x;
        character.gridy = y;

        // 자신보다 앞에 있는 오브젝트와 히트 테스트를 해서 겹치면 반투명하게 만들어야 한다.
        for (let i = 0; i < this.objectMap.length; ++i) {
            this.objectMap[i].alpha = 1;
        }

        for (let j = y; j < this.height; ++j) {
            for (let i = 0; i <= x; ++i) {
                const tile = this.objectMap[i + j * this.mapWidth];
                if (tile && tile.check) {
                    // 충돌체크를 한다
                    const hit = hitTestRectangle(tile.getBounds(), character.getBounds());
                    if (hit) {
                        tile.alpha = 0.5;
                    }
                }
            }
        }

        let alpha =  1;
        const step = () => {
            for (let i = 0; i < this.objectMap.length; ++i) {

                const _x = i % this.mapWidth;
                const _y = i / this.mapWidth;

                if (x - 3 <= _x && _x < x + 3 && 
                    y - 5 <= _y && _y < y + 5) {
                        continue;
                    }


                if (this.groundMap[i].cover) {
                    this.groundMap[i].position.y +=1;
                    this.groundMap[i].alpha = alpha;
                }

                if (this.objectMap[i].cover) {
                    this.objectMap[i].position.y +=1;
                    this.objectMap[i].alpha = alpha;
                }
            }
            alpha -= 0.02;
            if (alpha > 0) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }
}

Engine.IsoMap = IsoMap;


class Character extends PIXI.Container {
    constructor() {
        super();

        this.gridX = 0;
        this.gridY = 0;

        // 스프라이트를 읽어와서 애니메이션을 시킨다.

        const frames = [];          
        for (var i = 0; i < 8; i++) {
            // magically works since the spritesheet was loaded with the pixi loader
            frames.push(PIXI.Texture.fromFrame('walk_down' + i + '.png'));
        }

        // 그림자를 추가한다
        const shadow = new PIXI.Sprite(PIXI.Texture.fromFrame("shadow.png"));
        shadow.position.y = -shadow.height;
        this.addChild(shadow);

        const anim = new PIXI.extras.AnimatedSprite(frames);
        anim.animationSpeed = 0.2;
        anim.play();
        anim.position.y = -48; // 하드코딩
        this.addChild(anim);
    }
}

//The `hitTestRectangle` function
function hitTestRectangle(rect1, rect2) {
    return  (rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y);
};

Engine.Character = Character;