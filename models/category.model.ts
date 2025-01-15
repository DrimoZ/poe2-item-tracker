class ItemCategory {

    // Private Properties

    private _label: string;
    private _knownIds: string[];

    private _isIgnored: boolean;

    private _items: Set<Item>;
    private _ignoredItems: Set<Item>;

    // Life Cycle

    constructor(fields: {
        label: string,
        knownIds?: string[]
    }) {
        this._label = fields.label;
        this._knownIds = fields.knownIds || [];

        this._isIgnored = false;
        this._items = new Set<Item>();
        this._ignoredItems = new Set<Item>();
    }

    // Interface (Equals)

    public equals(category: ItemCategory): boolean {
        return this._label === category.label;
    }

    // Interface

    public addItems(items: Item[]): void {
        items.forEach((item: Item) => {
            this.addItem(item);
        });
    }

    public addItem(item: Item): void {
        if (!this._items.has(item)) {
            this._items.add(item);
        }
    }

    public addIgnoredItems(items: Item[]): void {
        items.forEach((item: Item) => {
            this.addIgnoredItem(item);
        });
    }

    public addIgnoredItem(item: Item): void {
        if (!this._ignoredItems.has(item)) {
            this._ignoredItems.add(item);
        }
    }

    public ignore(): void {
        this._isIgnored = true;
    }

    public unignore(): void {
        this._isIgnored = false;
    }

    // Getters

    public get label(): string {
        return this._label;
    }

    public get knownIds(): string[] {
        return this._knownIds;
    }

    public get items(): Set<Item> {
        return this._items;
    }

    public get isIgnored(): boolean {
        return this._isIgnored;
    }

    public get ignoredItems(): Set<Item> {
        return this._ignoredItems;
    }
}