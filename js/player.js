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

    addItem(itemId, itemType) {
        const item = new Item(itemId, itemType);
        this.items.push(item);
    }

    getItemByType(itemType) {
        for(const item of this.items) {
            if (item.itemType === itemType) {
                return item;
            }
        }
        return null;
    }

    deleteItem(itemId) {
        for (let i = 0; i < this.items.length; i++) {
            const item = this.items[i];
            if (item.itemId === itemId) {
                this.items.splice(i, 1);
                return;
            }
        }
    }
}

class Item {
    constructor(itemId, itemType) {
        this.itemId = itemId;
        this.itemType = itemType;
    }
}