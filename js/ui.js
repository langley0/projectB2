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

}