enum ItemRarity {
    NORMAL = 'Normal',
    MAGIC = 'Magic',
    RARE = 'Rare',
    UNIQUE = 'Unique',

    NONE = 'None'
}

class Item {

    // Private Properties

    private _name: string;

    private _typeLine: string;
    private _baseType: string;
    private _descrText: string;

    private _rarity: ItemRarity;
    private _icon: string;

    private _iLvl: number;
    private _maxStackSize: number;

    // Life Cycle

    constructor(fields: {
        name?: string,
        typeLine: string,
        baseType: string,
        descrText: string,
        rarity?: ItemRarity,
        icon: string,
        iLvl?: number,
        maxStackSize: number
    }) {
        this._name = fields.name || fields.typeLine;
        this._typeLine = fields.typeLine;
        this._baseType = fields.baseType;
        this._descrText = fields.descrText;
        this._rarity = fields.rarity || ItemRarity.NONE;
        this._icon = fields.icon;
        this._iLvl = fields.iLvl || -1;
        this._maxStackSize = fields.maxStackSize;
    }

    // Interface (Equals)

    public equals(item: Item): boolean {
        return this._name === item.name && this._typeLine === item.typeLine 
        && this._baseType === item.baseType && this._rarity === item.rarity 
        && this._iLvl === item.iLvl;
    }

    // Getters

    public get name(): string {
        return this._name;
    }

    public get typeLine(): string {
        return this._typeLine;
    }

    public get baseType(): string {
        return this._baseType;
    }

    public get descrText(): string {
        return this._descrText;
    }

    public get rarity(): ItemRarity {
        return this._rarity;
    }

    public get icon(): string {
        return this._icon;
    }

    public get iLvl(): number {
        return this._iLvl;
    }

    public get maxStackSize(): number {
        return this._maxStackSize;
    }
}