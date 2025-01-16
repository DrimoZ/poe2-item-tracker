import { ItemCategory } from "../../models/category.model";
import { Item, ItemRarity } from "../../models/item.model";
import { DatabaseManager } from "../database.manager";

class ItemDatabaseManager {
    
    // Static Instance
    
    private static _instance: ItemDatabaseManager;
    
    public static get instance(): ItemDatabaseManager {
        if (!ItemDatabaseManager._instance) {
            ItemDatabaseManager._instance = new ItemDatabaseManager();
        }
        
        return ItemDatabaseManager._instance;
    }

    // Private Properties

    private _dbManager: DatabaseManager;
    
    // Life Cycle

    private constructor() {
        this._dbManager = DatabaseManager.instance;
    }

    // Interface (Categories)

    public getCategories(): Array<ItemCategory> {
        const itemCategories = this._dbManager.itemsDb.prepare(
            `SELECT 
                c.id as id,
                c.display_name as displayName,
                GROUP_CONCAT(l.label ORDER BY l.label SEPARATOR ';') AS labels
            FROM 
                item_category c
            LEFT JOIN 
                item_category_labels l
            ON 
                c.id = l.category_id
            GROUP BY 
                c.id, c.display_name;`
        ).all() as Array<{
            id: string;
            displayName: string;
            labels: string;
        }>;

        return itemCategories.map((itemCategory) => {
            return new ItemCategory({
                id: itemCategory.id,
                displayName: itemCategory.displayName,
                knowLabels: itemCategory.labels.split(';')
            });
        });
    }

    public getCategoriesWithItems(): Array<ItemCategory> {
        const itemCategories = this.getCategories();

        for (const itemCategory of itemCategories) {
            itemCategory.addItems(this.getItemsByCategory(itemCategory.id, false));
            itemCategory.addIgnoredItems(this.getItemsByCategory(itemCategory.id, true));
        }

        return itemCategories;
    }

    public insertOrUpdateCategory(category: ItemCategory): void {
        if (this.isCategoryPresent(category)) {
            this.updateCategory(category);
        } else {
            this.insertCategory(category);
        }
    }

    // Interface (Items)

    public getItemsByCategory(categoryId: string, ignored: boolean): Array<Item> {
        const items = this._dbManager.itemsDb.prepare(
            `SELECT 
                i.id as id,
                i.name as name,

                i.type_line as typeLine,
                i.base_type as baseType,
                GROUP_CONCAT(d.descr_text ORDER BY d.descr_text SEPARATOR ';') as descrText,

                i.rarity as rarity,
                i.icon as icon,

                i.ilvl as iLvl,
                i.max_stack_size as maxStackSize
            FROM 
                items i
            LEFT JOIN 
                item_category_labels l
            ON 
                c.id = l.category_id
            WHERE
                i.category_id = ? AND i.ignored = ?
            GROUP BY 
                c.id, c.display_name;`
        ).all(categoryId, ignored) as Array<{
            id: string;
            name?: string,
            typeLine?: string,
            baseType?: string,
            descrText?: string,
            rarity?: ItemRarity,
            icon?: string,
            iLvl?: number,
            maxStackSize?: number
        }>;

        return items.map((item) => {
            return new Item({
                id: item.id,
                name: item.name,
                typeLine: item.typeLine,
                baseType: item.baseType,
                descrText: item.descrText?.split(';') || [],
                rarity: item.rarity,
                icon: item.icon,
                iLvl: item.iLvl,
                maxStackSize: item.maxStackSize
            });
        });
    }

    public insertOrUpdateItem(item: Item, categoryId: string, ignored: boolean): void {
        if (this.isItemPresent(item)) {
            this.updateItem(item, categoryId, ignored);
        } else {
            this.insertItem(item, categoryId, ignored);
        }
    }

    // Inner Work (Categories)

    private insertCategory(category: ItemCategory): void {
        this._dbManager.itemsDb.prepare(
            `INSERT INTO 
                item_category (id, display_name, ignored)
            VALUES 
                (?, ?, ?);`
        ).run(category.id, category.displayName, category.isIgnored);

        this.insertKnownLabelsForCategory(category);

        for (const item of category.items) {
            this.insertOrUpdateItem(item, category.id, false);
        }

        for (const item of category.ignoredItems) {
            this.insertOrUpdateItem(item, category.id, true);
        }
    }

    private updateCategory(category: ItemCategory): void {
        this._dbManager.itemsDb.prepare(
            `UPDATE 
                item_category
            SET 
                display_name = ?
            WHERE 
                id = ?;`
        ).run(category.displayName, category.id);

        this.insertKnownLabelsForCategory(category);

        for (const item of category.items) {
            this.insertOrUpdateItem(item, category.id, false);
        }

        for (const item of category.ignoredItems) {
            this.insertOrUpdateItem(item, category.id, true);
        }
    }

    private insertKnownLabelsForCategory(category: ItemCategory): void {
        for (const label of category.knowLabels) {
            this._dbManager.itemsDb.prepare(
                `INSERT INTO 
                    item_category_labels (category_id, label)
                VALUES 
                    (?, ?);`
            ).run(category.id, label);
        }
    }

    private isCategoryPresent(category: ItemCategory): boolean {
        return !!this._dbManager.itemsDb.prepare(
            `SELECT 
                c.id
            FROM 
                item_category c
            WHERE 
                c.id = ?;`
        ).get(category.id);
    }

    // Inner Work (Items)

    private insertItem(item: Item, categoryId: string, ignored: boolean): void {
        this._dbManager.itemsDb.prepare(
            `INSERT INTO 
                items (id, name, type_line, base_type, rarity, icon, ilvl, max_stack_size, category_id, ignored)
            VALUES 
                (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`
        ).run(
            item.id,
            item.name,
            item.typeLine,
            item.baseType,
            item.rarity,
            item.icon,
            item.iLvl,
            item.maxStackSize,
            categoryId,
            ignored
        );

        this.insertItemDescription(item);
    }

    private updateItem(item: Item, categoryId: string, ignored: boolean): void {
        this._dbManager.itemsDb.prepare(
            `UPDATE 
                items
            SET 
                name = ?,
                type_line = ?,
                base_type = ?,
                rarity = ?,
                icon = ?,
                ilvl = ?,
                max_stack_size = ?,
                category_id = ?,
                ignored = ?
            WHERE 
                id = ?;`
        ).run(
            item.name,
            item.typeLine,
            item.baseType,
            item.rarity,
            item.icon,
            item.iLvl,
            item.maxStackSize,
            categoryId,
            ignored,
            item.id
        );

        this.insertItemDescription(item);
    }

    private insertItemDescription(item: Item): void {
        for (const descrText of item.descrText) {
            this._dbManager.itemsDb.prepare(
                `INSERT INTO 
                    item_descriptions (item_id, descr_text)
                VALUES 
                    (?, ?);`
            ).run(item.id, descrText);
        }
    }

    private isItemPresent(item: Item): boolean {
        return !!this._dbManager.itemsDb.prepare(
            `SELECT 
                i.id
            FROM 
                items i
            WHERE 
                i.id = ?;`
        ).get(item.id);
    }

    private isItemIgnored(item: Item): boolean {
        return !!this._dbManager.itemsDb.prepare(
            `SELECT 
                i.id
            FROM 
                items i
            WHERE 
                i.id = ? and i.ignored = 1;`
        ).get(item.id);
    }
}

export { ItemDatabaseManager };