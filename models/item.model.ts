enum ItemRarity {
    NORMAL = 'Normal',
    MAGIC = 'Magic',
    RARE = 'Rare',
    UNIQUE = 'Unique',

    NONE = 'None'
}

class Item {

    // Static Properties

    public static readonly undefinedString = '';
    public static readonly undefinedNumber = -1;

    // Private Properties

    private _id: string;
    private _name: string;

    private _typeLine: string;
    private _baseType: string;
    private _descrText: Array<string>;

    private _rarity: ItemRarity;
    private _icon: string;

    private _iLvl: number;
    private _maxStackSize: number;

    // Life Cycle

    constructor(fields: {
        id: string;
        name?: string,
        typeLine?: string,
        baseType?: string,
        descrText?: Array<string>,
        rarity?: ItemRarity,
        icon?: string,
        iLvl?: number,
        maxStackSize?: number
    }) {
        this._id = fields.id;

        if (!fields.typeLine && fields.baseType) {
            this._typeLine = this._baseType = fields.baseType;
        }
        else if (fields.typeLine && !fields.baseType) {
            this._typeLine = this._baseType = fields.typeLine;
        }
        else if (fields.typeLine && fields.baseType) {
            this._typeLine = fields.typeLine;
            this._baseType = fields.baseType;
        }
        else {
            throw new Error('Item must have at least one of the following: typeLine or baseType');
        }

        this._name = fields.name || Item.undefinedString;
        this._descrText = fields.descrText || [];

        this._rarity = fields.rarity || ItemRarity.NONE;
        this._icon = fields.icon || Item.undefinedString;

        this._iLvl = fields.iLvl || Item.undefinedNumber;
        this._maxStackSize = fields.maxStackSize || Item.undefinedNumber;
    }

    // Interface (To String)

    public displayName(): string {
        return (this._name !== Item.undefinedString ? this._name + ' ' : '') + this._typeLine;
    }

    // Interface (Equals)

    public equals(item: Item): boolean {
        return this._id === item.id && this._name === item.name && this._typeLine === item.typeLine 
        && this._baseType === item.baseType && this._rarity === item.rarity 
        && this._iLvl === item.iLvl;
    }

    // Getters

    public get id(): string {
        return this._id;
    }

    public get name(): string {
        return this._name;
    }

    public get typeLine(): string {
        return this._typeLine;
    }

    public get baseType(): string {
        return this._baseType;
    }

    public get descrText(): Array<string> {
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

export { Item, ItemRarity };