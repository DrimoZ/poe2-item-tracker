// Start command for main.ts in terminal
// ts-node main.ts

// fetch static data from api api/data/static

import { AxiosRequestConfig } from 'axios';

import { ItemCategory } from './models/category.model';
import { Item } from './models/item.model';

import { RequestResponse, RequestsManager } from './services/requests.manager';
import { DatabaseManager } from './databases/database.manager';

import { staticCategories } from './static/categories.static';
import { ItemDatabaseManager } from './databases/requests/item-database.manager';
import { staticItems } from './static/items.static';


interface OldItemCategory {
    id: string;
    label: string;
    entries: {
        id: string;
        text: string;
        image: string;
    }[];
}

const requestsManager = RequestsManager.instance;

async function dataProcess() {

    // Fetch static data
    const staticItemsData = await requestsManager.addRequest({
        url: '/api/trade2/data/static',
        method: 'GET',
    }) as RequestResponse;

    const itemCategories: OldItemCategory[] = staticItemsData.response.data.result;
    
    console.log("\n\n==============================================");
    console.log(`Starting to process items data ...\n`);

    console.time(`Items data fetched in`);

    // Process the item categories
    for (const category of itemCategories) {
        const categoryEntries = category.entries;
        const categoryId = category.id;

        console.log("\n\n==============================================");
        console.log(`Starting to process category: ${category.label} ...\n`);
        console.time(`${category.label} fetched in`, );

        // Process the category entries
        for (const entry of categoryEntries) {
            if (entry.id.includes('sep') || entry.id.includes('shard')) continue;
            
            // Process the entry
            console.time(`\tCategory: ${categoryId}, Entry: ${entry.id}, Text: ${entry.text}`);

            const a = await requestsManager.addRequest({
                url: '/api/trade2/exchange/Standard',
                method: 'POST',
                data: {
                    "query": {
                        "status": {
                            "option": "Online"
                        },
                        "want": [entry.id],
                        "have": ["exalted"]
                    },
                } as AxiosRequestConfig,
            }) as RequestResponse;

            console.timeEnd(`\tCategory: ${categoryId}, Entry: ${entry.id}, Text: ${entry.text}`);

            // console.log(a.response.data)
        }

        console.log(`\n`);
        console.timeEnd(`${category.label} fetched in`, );

    }

    console.log("\n");
    console.timeEnd(`Items data fetched in`);
}

async function main() {
    // Start the requests manager
    await requestsManager.start();

    // Start Database Manager
    await DatabaseManager.instance;

    while (true) {
        // await dataProcess();
        await processAll();
    }

    // Stop the requests manager
    await requestsManager.stop();
}

main().catch((error) => {
    console.error('Error in main execution:', error);
});


const externalIgnoreRules = [
    {
        type: Item, ignore: true, rule: (obj: Item | ItemCategory) => {
            if (obj instanceof Item) 
                return (obj as Item).name.includes('shard');
            return false;
        }
    },
    {
        type: ItemCategory, ignore: true, rule: (obj: Item | ItemCategory) => {
            if (obj instanceof ItemCategory) 
                return (obj as ItemCategory).id.includes('shard');
            return false;
        }
    }
]

// Get data from the database
async function  getDataFromDatabase(): Promise<Array<ItemCategory>> {
    const db = ItemDatabaseManager.instance;

    for(const category of staticCategories) {
        let si = staticItems.filter(si => si.categoryId === category.id);
        if (si) {
            await category.addIgnoredItems(si.filter(si => si.ignored).map(si => si.item));
            await category.addItems(si.filter(si => !si.ignored).map(si => si.item));
        }

        await new Promise((resolve) => setTimeout(resolve, 1_000));
        await db.insertOrUpdateCategory(category);
    }

    await new Promise((resolve) => setTimeout(resolve, 10_000));
    return db.getCategoriesWithItems();
}


async function processAll() {
    console.time(`|| All categories fetched in`);

    const itemCategories = await getDataFromDatabase();

    for (const itemCategory of itemCategories) {
        await processCategory(itemCategory);
    }

    console.log("\n||==============================================\n||");
    console.timeEnd(`|| All categories fetched in`);
    console.log("||\n||==============================================\n\n\n");

    await new Promise((resolve) => setTimeout(resolve, 10_000));
}

// Process One Category
async function processCategory(itemCategory: ItemCategory) {
    console.log("\n==============================================");
    console.log(`Starting to process category: ${itemCategory.displayName} (${itemCategory.items.length} items) ...\n`);
    console.time(`${itemCategory.displayName} category fetched in`);

    if (itemCategory.isIgnored) {
        console.log(`Category is ignored. Skipping ...`);
        return;
    }

    for (const rule of externalIgnoreRules) {
        if (itemCategory instanceof rule.type && rule.rule(itemCategory)) {
            console.log(`Category is ignored by external rule. Skipping ...`);
            return;
        }
    }

    for (const item of itemCategory.getUnignoredItems()) {
        await processItem(item);
    }

    console.timeEnd(`${itemCategory.displayName} category fetched in`);
}

// Process One Item
async function processItem(item: Item) {
    // console.log("\n\t==============================================");
    // console.log(`\tStarting to process item: ${item.displayName()} ...\n`);
    console.time(`\t${item.displayName()} fetched in`);

    for (const rule of externalIgnoreRules) {
        if (item instanceof rule.type && rule.rule(item)) {
            console.log(`\t${item.displayName()} is ignored by external rule. Skipping ...`);
            return;
        }
    }

    // Process the item
    const response = item.fetchMethod === 'exchange' ? await processExchange(item) : await processSearch(item);
    console.timeEnd(`\t${item.displayName()} fetched in`);
}


async function processExchange(item: Item) {
    const response = await requestsManager.addRequest({
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

    return response;
}

async function processSearch(item: Item) {
    const response = await requestsManager.addRequest({
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

    return response;
}