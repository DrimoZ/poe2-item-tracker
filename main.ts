// Start command for main.ts in terminal
// ts-node main.ts

// fetch static data from api api/data/static

import { AxiosRequestConfig } from 'axios';

import { ItemCategory } from './models/category.model';
import { Item } from './models/item.model';

import { RequestResponse, RequestsManager } from './services/requests.manager';
import { ItemDatabaseManager } from './databases/requests/item-database.manager';

import { staticItems } from './static/items.static';
import { staticCategories } from './static/categories.static';



const requestsManager: RequestsManager = RequestsManager.instance;
const itemDatabaseManager: ItemDatabaseManager = ItemDatabaseManager.instance;

let isRunning: boolean = true;

async function main() {
    // Start the requests manager
    await requestsManager.start();

    // Delay for 10 seconds
    await new Promise((resolve) => setTimeout(resolve, 10_000));

    // Process the static data
    await processStaticData();

    // Delay for 10 seconds
    await new Promise((resolve) => setTimeout(resolve, 10_000));

    while (isRunning) {
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
    for(const category of staticCategories) {
        let si = staticItems.filter(si => si.categoryId === category.id);
        if (si) {
            await category.addIgnoredItems(si.filter(si => si.ignored).map(si => si.item));
            await category.addItems(si.filter(si => !si.ignored).map(si => si.item));
        }

        await new Promise((resolve) => setTimeout(resolve, 1_000));
        await itemDatabaseManager.insertOrUpdateCategory(category);
    }

    await new Promise((resolve) => setTimeout(resolve, 10_000));
    return itemDatabaseManager.getCategoriesWithItems();
}

// Fetch Static Data from API
async function fetchStaticData(): Promise<RequestResponse> {
    const response = await requestsManager.addRequest({
        url: '/api/trade2/data/static',
        method: 'GET',
    }) as RequestResponse;

    return response;
}

// Process Static Data to Database
async function processStaticData() {

    console.log("\nProcessing static data ...\n");

    const response = await fetchStaticData();
    let dbCategories = await getDataFromDatabase();

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

        await itemDatabaseManager.insertOrUpdateCategory(itemCategory);
        console.log(`Category ${itemCategory.displayName} has ${itemCategory.items.length} items and ${itemCategory.ignoredItems.length} ignored items`);
    }
}



// Process All Categories
async function processAll() {
    console.time(`|| All categories fetched in`);

    const itemCategories = await itemDatabaseManager.getCategoriesWithItems();

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