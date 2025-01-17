import { AxiosRequestConfig } from "axios";

import { ItemCategoryManager } from "./item-category.manager";
import { RequestResponse, RequestsManager } from "./requests.manager";

import { ItemCategory } from "../models/category.model";
import { FetchMethod, Item } from "../models/item.model";

class FetcherService {

    // Static Instance

    private static _instance: FetcherService;

    public static get instance(): FetcherService {
        if (!FetcherService._instance) {
            FetcherService._instance = new FetcherService();
        }
        return FetcherService._instance;
    }

    // Private Properties

    private readonly _requestsManager: RequestsManager;
    private readonly _itemCategoryManager: ItemCategoryManager;

    private _isRunning: boolean;

    // Life Cycle

    public constructor() {
        this._requestsManager = RequestsManager.instance;

        this._itemCategoryManager = ItemCategoryManager.instance;

        this._isRunning = false;
    }

    // Interface    

    public async startGlobalFetchingProcess(): Promise<void> {
        if (this._isRunning) {
            console.log("Fetching process is already running.");
            return;
        }
    
        this._isRunning = true;
        console.log("Starting global fetching process...");
    
        try {
            await this.processAll();
        } catch (error) {
            console.error("Error during global fetching process:", error);
        } finally {
            this._isRunning = false;
        }
    }
    
    public async stopGlobalFetchingProcess(): Promise<void> {
        if (!this._isRunning) {
            console.log("No fetching process is running.");
            return;
        }
    
        console.log("Stopping global fetching process...");
        this._isRunning = false;
    }

    public async startOneCategoryFetchingProgress(categoryId: string): Promise<void> {
        if (this._isRunning) {
            console.log("Cannot process a single category while another process is running.");
            return;
        }
    
        const categories = await this._itemCategoryManager.getCategories();
        const category = categories.find(cat => cat.id === categoryId);
    
        if (!category) {
            console.error(`Category with ID ${categoryId} not found.`);
            return;
        }
    
        this._isRunning = true;
    
        try {
            await this.processCategory(category);
        } catch (error) {
            console.error("Error during category fetching:", error);
        } finally {
            this._isRunning = false;
        }
    }

    // Inner Work

    // Process All Categories
    private async processAll() {
        console.time(`|| All categories fetched in`);

        const itemCategories = await this._itemCategoryManager.getCategories();
        console.log(`\n\n\n||==============================================\n||`);
        console.log(`|| Processing ${itemCategories.length} categories ...\n||`);
        console.log(`||==============================================||\n\n`);


        for (const itemCategory of itemCategories) {
            
            await this.processCategory(itemCategory);
        }

        console.log("\n||==============================================\n||");
        console.timeEnd(`|| All categories fetched in`);
        console.log("||\n||==============================================\n\n\n");

        await new Promise((resolve) => setTimeout(resolve, 10_000));
    }

    // Process One Category
    private async processCategory(itemCategory: ItemCategory) {
        if (!this._isRunning) {
            return;
        }
        console.log("\n==============================================");
        console.log(`Starting to process category: ${itemCategory.displayName} (${itemCategory.items.length} items) ...\n`);

        if (itemCategory.isIgnored) {
            console.log(`${itemCategory.displayName} Category is ignored. Skipping ...`);
            return;
        }

        console.time(`${itemCategory.displayName} Category fetched in`);

        for (const item of itemCategory.getUnignoredItems()) {
            await this.processItem(item);
        }

        console.timeEnd(`${itemCategory.displayName} Category fetched in`);
    }

    // Process One Item
    private async processItem(item: Item) {
        // console.log("\n\t==============================================");
        // console.log(`\tStarting to process item: ${item.displayName()} ...\n`);

        console.time(`\t${item.displayName()} fetched in`);

        // Process the item
        item.fetchMethod === FetchMethod.EXCHANGE ? await this.processExchange(item) : await this.processSearch(item);

        console.timeEnd(`\t${item.displayName()} fetched in`);
    }

    private async processExchange(item: Item): Promise<void> {
        const response = await this._requestsManager.addRequest({
            url: '/api/trade2/exchange/Standard',
            method: 'POST',
            data: {
                "query": {
                    "status": {
                        "option": "Online"
                    },
                    "want": [item.id],
                    "have": ["exalted"]
                },
            } as AxiosRequestConfig,
        }) as RequestResponse;


    }

    private async processSearch(item: Item): Promise<void> {
        const response = await this._requestsManager.addRequest({
            url: '/api/trade2/search/Standard',
            method: 'POST',
            data: {
                "query": {
                    "status": {
                        "option": "Online"
                    },
                    "type": item.baseType
                },
            } as AxiosRequestConfig,
        }) as RequestResponse;
    }
}

export { FetcherService };