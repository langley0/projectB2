class Dialog extends PIXI.Container {
    constructor(text, width, height) {
        super();

        const plane = new PIXI.mesh.NineSlicePlane(PIXI.Texture.from('dialog.png'), 12, 10, 12, 10);
        plane.width = width;
        plane.height = height;

        const innerWidth = width - 32;

        // 텍스트를 화면에 뿌린다
        const dialogText = new PIXI.Text(text,{fontFamily : 'Arial', fontSize: 24, fill : 0xffffff, align : 'center', wordWrap: true, wordWrapWidth: innerWidth });
        // 화면중앙에 배치를 한다
        dialogText.anchor.x = 0.5;
        dialogText.anchor.y = 0.5;
        dialogText.position.x = width /2;
        dialogText.position.y = height /2;

        this.addChild(plane);
        this.addChild(dialogText);
    }
}