class Player extends Character {
    constructor() {
        super();

        this.inventory = new Inventory();
    }
}

class Inventory {
    constructor() {
        this.items = [];
    }

    addItem(itemId) {
        const item = new Item(itemId);
        this.items.push(item);
    }
}

class Item {
    constructor(itemId) {
        this.itemId = itemId;
    }
}