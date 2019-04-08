class BaseModal extends PIXI.Container {
    constructor(ui, width, height) {
        super();

        const plane = new PIXI.mesh.NineSlicePlane(PIXI.Texture.from('dialog.png'), 12, 10, 12, 10);
        plane.position.x = (ui.screenWidth - width) / 2;
        plane.position.y = (ui.screenHeight - height) /2;
        plane.width = width;
        plane.height = height;
        this.plane = plane;

        const background = new PIXI.Sprite(PIXI.Texture.WHITE);
        background.alpha = 0;
        background.width = ui.screenWidth;
        background.height = ui.screenHeight;
        background.interactive = true; // 클릭을 방지한다
        background.mouseup = this.onClick.bind(this);
        
        this.addChild(background);
        this.addChild(plane);
    }

    addTitle(text) {
        const style = new PIXI.TextStyle({fontFamily : 'Arial', fontSize: 24, fill : 0xffffff, align : 'center' });
        const titleText = new PIXI.Text(text, style);
        const textMetrics = PIXI.TextMetrics.measureText(text, style);

        const width = this.plane.width - 24;
        const height = textMetrics.height + 16;

        // 타이틀을 여기에 추가한다
        const titlePlane = new PIXI.mesh.NineSlicePlane(PIXI.Texture.from('dialogtitle.png'), 12, 10, 12, 10);
        titlePlane.position.x = (this.plane.width - width) / 2;
        titlePlane.position.y = 12;
        titlePlane.width = width;
        titlePlane.height = height;
        
        titleText.anchor.x = 0.5;
        titleText.anchor.y = 0.5;
        titleText.position.x = width /2;
        titleText.position.y = height /2;

        titlePlane.addChild(titleText);
        this.plane.addChild(titlePlane);
    }

    onClick(event) {
        // 여기서 입력을 가로챈다
        event.stopped = true;
        
        // 창을 닫는다
        this.visible = false;
    }
}

class ChatBallon extends PIXI.Container {
    constructor(character, chatText) {
        super(); 

        // 한글자씩 나오는 애니메이션을 고민해보자
        this.follower = character;
        
        const MAX_CHAT_WIDTH = 180;

        const style = new PIXI.TextStyle({fontFamily : 'Arial', fontSize: 12, fill : 0, align : 'center', wordWrap: true, wordWrapWidth: MAX_CHAT_WIDTH });
        const textMetrics = PIXI.TextMetrics.measureText(chatText, style);

        // 캐릭터의 위치에 맞추어서 넣어야 한다
        
        const plane = new PIXI.mesh.NineSlicePlane(PIXI.Texture.from('chatballon.png'), 12, 10, 12, 10);
        plane.width = textMetrics.width + 36;
        plane.height = textMetrics.height + 36;
        this.plane = plane;

        const comma = new PIXI.Sprite(PIXI.Texture.from('chatballon_comma.png'));
        comma.position.y = plane.height - 5;
        this.comma = comma;

        const text = new PIXI.Text(chatText, style);
        text.anchor.x = 0.5;
        text.anchor.y = 0.5;
        text.position.x = plane.width / 2;
        text.position.y = plane.height / 2;
        

        this.addChild(plane);
        plane.addChild(comma);
        plane.addChild(text);

        this.updatePosition();
    }

    updatePosition() {
        const character = this.follower;
        const plane = this.plane;
        const comma = this.comma;

        const gpos = character.toGlobal(new PIXI.Point(0, 0));
        plane.position.x = Math.max(gpos.x - plane.width / 2, 0);
        plane.position.y = Math.max(gpos.y - character.height - plane.height - 36, 0);

        comma.position.x = plane.width / 2;
    }
}


class Dialog extends PIXI.Container {
    constructor(ui, width, height) {
        super();

        const plane = new PIXI.mesh.NineSlicePlane(PIXI.Texture.from('dialog.png'), 12, 10, 12, 10);
        plane.position.x = (ui.screenWidth - width) / 2;
        plane.position.y = (ui.screenHeight - height) - 12;
        plane.width = width;
        plane.height = height;
        this.plane = plane;

        const background = new PIXI.Sprite(PIXI.Texture.WHITE);
        background.alpha = 0;
        background.width = ui.screenWidth;
        background.height = ui.screenHeight;
        background.interactive = true; // 클릭을 방지한다
        background.mouseup = this.onClick.bind(this);

        // 다이얼로그안에 내부 사이즈를 구한다
        this.innerWidth = width - 32;
        
        this.addChild(background);
        this.addChild(plane);
    }

    onClick(event) {
        // 여기서 입력을 가로챈다
        event.stopped = true;
        
        // 창을 닫는다
        this.visible = false;
    }

    setText(text) {
        if (this.text) {
            this.plane.removeChild(this.text);
        }

        // 텍스트를 화면에 뿌린다
        const dialogText = new PIXI.Text(text,{fontFamily : 'Arial', fontSize: 24, fill : 0xffffff, align : 'center', wordWrap: true, wordWrapWidth: this.innerWidth });
        // 화면중앙에 배치를 한다
        dialogText.anchor.x = 0.5;
        dialogText.anchor.y = 0.5;
        dialogText.position.x = this.plane.width /2;
        dialogText.position.y = this.plane.height /2;
        this.text = dialogText;

        this.plane.addChild(dialogText);

    }
}

class StageTitle extends PIXI.Container {
    constructor(ui, text) {
        super();
        const style = new PIXI.TextStyle({fontFamily : 'Arial', fontSize: 48, fill : 0xffffff, align : 'center', dropShadow: true });
        const title = new PIXI.Text(text, style);
        // 화면중앙에 배치를 한다
        title.anchor.x = 0.5;
        title.anchor.y = 0.5;
        title.position.x = ui.screenWidth/2;
        title.position.y = ui.screenHeight * 0.25;
        this.addChild(title);

        const textMetrics = PIXI.TextMetrics.measureText(text, style);
        const underline = new PIXI.Sprite(PIXI.Texture.WHITE);
        underline.width = textMetrics.width + 8;
        underline.height = 4;
        underline.anchor.x = 0.5;
        underline.anchor.y = 0.5;
        underline.position.y = textMetrics.height/2 + 4;

        title.addChild(underline);
        

        this.title = title;
    }

    set titleScale(value) {
        this.title.scale.x = value;
    }

    get titleScale() {
        return this.title.scale.x;
    }
}

class InventoryUI extends PIXI.Container {
    constructor(ui) {
        super();

        const base = new PIXI.Sprite(PIXI.Texture.fromFrame("inventory.png"));
        // 위치는 일단 가운데 ...
        base.anchor.x = 0.5;
        base.anchor.y = 0.5;
        base.position.x = ui.screenWidth / 2;
        base.position.y = ui.screenHeight / 2;
        this.addChild(base);

        this.base = base;
    }

    update(playerInventory) {
        this.base.removeChildren();
        // 인벤토리에 있는 아이템을 화면에 표시한다
        let index = 0;
        const inventoryWidth = 4;
        playerInventory.eachItem((item) => {
            // 열쇠를 찍는다
            const x = index % inventoryWidth;
            const y = Math.floor(index / inventoryWidth);
            
            const itemSpr = new PIXI.Sprite(PIXI.Texture.fromFrame("key.png"));
            itemSpr.position.x = x * 85 + 17 - this.base.width/2;
            itemSpr.position.y = y * 85 + 60 - this.base.height/2;

            this.base.addChild(itemSpr);

            ++index;
        });
    }
}

class UI extends PIXI.Container {
    constructor(game) {
        super();

        this.game = game;
        this.game.foreground.addChild(this);

        this.screenWidth = game.screenWidth;
        this.screenHeight = game.screenHeight;


        this.dialog = new Dialog(this, 700, 150);
        this.dialog.visible = false;
        this.addChild(this.dialog);

        this.theater = new PIXI.Sprite(PIXI.Texture.fromFrame("theater.png"));
        this.theater.visible =false;
        this.addChild(this.theater);

        this.itemAcquire = new BaseModal(this, 400, 300);
        this.itemAcquire.addTitle("아이템 획득");
        const itemSprite = new PIXI.Sprite(PIXI.Texture.fromFrame("item3.png"));
        itemSprite.anchor.x = 0.5;
        itemSprite.anchor.y = 0.5;
        itemSprite.position.x = this.itemAcquire.width / 2;
        itemSprite.position.y = this.itemAcquire.height / 2 - 20;
        const itemText = new PIXI.Text("개발용으로 만들어진 아이템.\n아직 인벤토리가 없는 것은 비밀이다.",{fontFamily : 'Arial', fontSize: 16, fill : 0xffffff, align : 'center', wordWrap: true, wordWrapWidth: this.itemAcquire.width /2 });
        itemText.anchor.x = 0.5;
        itemText.anchor.y = 0.5;
        itemText.position.x = this.itemAcquire.width / 2;
        itemText.position.y = itemSprite.position.y + itemSprite.height / 2 + 32;
        this.itemAcquire.addChild(itemText);


        this.itemAcquire.addChild(itemSprite);
        this.itemAcquire.visible = false;
        this.addChild(this.itemAcquire);

        this.chatBallons = [];

        this.inventory = new InventoryUI(this);
        this.addChild(this.inventory);
        this.inventory.visible = false;
    }
    
    showDialog(text) {
        this.dialog.setText(text);
        this.dialog.visible = true;
    }

    hideDialog() {
        this.dialog.visible = false;
    }

    showStageTitle(text, delay) {
        // 스테이지 이름을 애니메이션 하면서 보여준다
        const title = new StageTitle(this, text);
        title.titleScale = 0;
        title.alpha = 0;

        this.addChild(title);

        this.game.tweens.addTween(title, 1, { titleScale: 1, alpha: 1 }, delay | 0, "easeInOut", true, () => {
            this.game.tweens.addTween(title, 1, { alpha: 0 }, 1, "easeInOut", false, () => {
                this.removeChild(title);
            });
        });
    }

    showStatUI() {
        // 여기서 스탯 ui 를 만든다
        
    }

    showTheaterScreen(duration) {
        // 위아래의 극장 스크린을 보여준다
        const theater = this.theater;
        theater.visible = true;

        if (duration > 0) {
            theater.alpha = 0;
            this.game.tweens.addTween(theater, duration, { alpha: 1 }, 0, "easeInOut", true);
        } else {
            theater.alpha = 1;
        }
    }

    hideTheaterScreen(duration) {
        const theater = this.theater;
        theater.visible = true;

        if (duration > 0) {
            this.game.tweens.addTween(theater, duration, { alpha: 0 }, 0, "easeInOut", true, () => {
                theater.visible = false;
            });
        } else {
            theater.alpha = 0;
            theater.visible = false;
        }
    }


    showItemAcquire() {
        this.itemAcquire.visible = true;
    }

    showChatBallon(character, text, duration) {
        // 일정시간동안 보였다가 사라지게 한다.
        const chat = new ChatBallon(character, text);
        this.addChild(chat);
        this.chatBallons.push(chat);
        duration = duration || 3;

        setTimeout(() => {
            this.removeChild(chat);
            const index = this.chatBallons.indexOf(chat);
            if (index >= 0) {
                this.chatBallons.splice(index, 1);
            }
        }, duration * 1000);
    }

    update() {
        // 풍선들을 관리한다
        for (const chat of this.chatBallons) {
            chat.updatePosition();
        }
    }

    showInventory() {
        this.inventory.visible = true;
        this.inventory.update(this.game.player.inventory);
    }

    hideInventory() {
        this.inventory.visible = false;
    }
}