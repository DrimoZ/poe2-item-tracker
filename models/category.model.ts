import { Item } from './item.model';

class ItemCategory {

    // Private Properties

    private _displayName: string;
    private _id: string;
    private _knowLabels: Array<string>;

    private _isIgnored: boolean;

    private _items: Array<Item>;
    private _ignoredItems: Array<Item>;

    // Life Cycle

    constructor(fields: {
        id: string,
        displayName: string,
        knowLabels?: Array<string>,
        ignored?: boolean
        items?: Array<Item>,
        ignoredItems?: Array<Item>
    }) {
        this._id = fields.id;
        this._displayName = fields.displayName;
        this._knowLabels = fields.knowLabels ?? [];

        this._isIgnored = fields.ignored ?? false;
        this._items = fields.items ?? [];
        this._ignoredItems = fields.ignoredItems ?? [];
    }

    // Interface (Equals)

    public equals(category: ItemCategory): boolean {
        return this._id === category.id;
    }

    // Interface (Items)

    public addItems(items: Array<Item>): void {
        items.forEach((item: Item) => {
            this.addItem(item);
        });
    }

    public addItem(item: Item): void {
        if (!this._items.includes(item)) {
            this._items.push(item);
        }
    }

    public addIgnoredItems(ignoredItems: Array<Item>): void {
        ignoredItems.forEach((item: Item) => {
            this.addIgnoredItem(item);
        });
    }

    public addIgnoredItem(ignoredItem: Item): void {
        if (!this._ignoredItems.includes(ignoredItem)) {
            this._ignoredItems.push(ignoredItem);
        }
    }

    public getUnignoredItems(): Array<Item> {
        return this._items.filter(item => !this._ignoredItems.includes(item));
    }

    // Interface (Ignore)

    public ignore(): void {
        this._isIgnored = true;
    }

    public unignore(): void {
        this._isIgnored = false;
    }

    // Getters

    public get displayName(): string {
        return this._displayName;
    }

    public get id(): string {
        return this._id;
    }

    public get knowLabels(): Array<string> {
        return this._knowLabels;
    }

    public get items(): Array<Item> {
        return this.getUnignoredItems();
    }

    public get isIgnored(): boolean {
        return this._isIgnored;
    }

    public get ignoredItems(): Array<Item> {
        return this._ignoredItems;
    }
}

export { ItemCategory };