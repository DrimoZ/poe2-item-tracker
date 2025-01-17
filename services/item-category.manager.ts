import { ItemDatabaseManager } from "../databases/requests/item-database.manager";
import { ItemCategory } from "../models/category.model";
import { Item } from "../models/item.model";
import { staticCategories } from "../static/categories.static";
import { staticItems } from "../static/items.static";
import { RequestResponse, RequestsManager } from "./requests.manager";

class ItemCategoryManager {

    // Static Instance

    private static _instance: ItemCategoryManager;

    public static get instance(): ItemCategoryManager {
        if (!ItemCategoryManager._instance) {
            ItemCategoryManager._instance = new ItemCategoryManager();
        }
        return ItemCategoryManager._instance;
    }

    // Private Properties

    private _requestsManager: RequestsManager;
    private _itemDatabaseManager: ItemDatabaseManager;

    private _categories: Array<ItemCategory>;
    private _isInitialized: boolean;
    private _initializing: boolean;

    // Calculated Properties

    public async getCategories(): Promise<Array<ItemCategory>> {
        if (!this._isInitialized) {
            await this.initialize();
        }

        while (this._initializing) {
            await new Promise((resolve) => setTimeout(resolve, 1_000));
        }

        return this._categories;
    }

    public async getCategoryHeads(): Promise<Map<string, string>> {
        if (!this._isInitialized) {
            await this.initialize();
        }

        while (this._initializing) {
            await new Promise((resolve) => setTimeout(resolve, 1_000));
        }

        return this._categories.reduce((map, category) => {
            map.set(category.id, category.displayName);
            return map;
        }, new Map<string, string>());
    }

    // Life Cycle

    private constructor() {
        this._requestsManager = RequestsManager.instance;
        this._itemDatabaseManager = ItemDatabaseManager.instance;

        this._categories = [];
        this._isInitialized = false;
        this._initializing = false;
    }

    // Inner Work

    public async initialize(): Promise<void> {
        if (!this._isInitialized) {
            this._isInitialized = true;
            this._initializing = true;

            await new Promise((resolve) => setTimeout(resolve, 10_000));
            await this.fetchCategories();

            this._initializing = false;
        }
    } 

    private async fetchCategories(): Promise<void> {
        try {
            console.log("\nProcessing static data ...\n");

            const response = await this.fetchStaticData();
            let dbCategories = await this.mergeStaticAndDatabaseEntries();

            console.log('\n\n')
            console.log('Response from static data:', response.response.data.result.length);
            console.log('Database categories:', dbCategories.length);

            for (const category of response.response.data.result) {
                let itemCategory = dbCategories.find((cat) => cat.knowLabels.includes(category.label) || cat.knowLabels.includes(category.id) || cat.id === category.id.toLowerCase());

                if (!itemCategory) {
                    console.log('Category not found in database. Creating new category ...');
                    itemCategory = new ItemCategory({
                        id: category.id.toLowerCase(),
                        displayName: category.label,
                        knowLabels: [category.label, category.id],
                        ignored: false
                    });
                }

                itemCategory.addItems(category.entries.filter((entry: any) => !entry.id.includes('sep')).map((entry: any) => {
                    return new Item({
                        id: entry.id,
                        baseType: entry.text,
                        icon: entry.image,
                    });
                }));

                await this._itemDatabaseManager.insertOrUpdateCategory(itemCategory);
                await this._categories.push(itemCategory);

                console.log(`Category ${itemCategory.displayName} has ${itemCategory.items.length} items and ${itemCategory.ignoredItems.length} ignored items`);
            }
        } 
        catch (error) {
            console.error("Error during category fetching:", error);
        }
    }

    private async fetchStaticData(): Promise<RequestResponse> {
        return await this._requestsManager.addRequest({
            url: '/api/trade2/data/static',
            method: 'GET',
        }) as RequestResponse;
    }

    private async mergeStaticAndDatabaseEntries(): Promise<Array<ItemCategory>> {
        for(const category of staticCategories) {
            let si = staticItems.filter(si => si.categoryId === category.id);
            if (si) {
                await category.addIgnoredItems(si.filter(si => si.ignored).map(si => si.item));
                await category.addItems(si.filter(si => !si.ignored).map(si => si.item));
            }
    
            await new Promise((resolve) => setTimeout(resolve, 1_000));
            await this._itemDatabaseManager.insertOrUpdateCategory(category);
        }
    
        await new Promise((resolve) => setTimeout(resolve, 10_000));
        return this._itemDatabaseManager.getCategoriesWithItems();
    }
}

export { ItemCategoryManager };