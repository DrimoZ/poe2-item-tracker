// Start command for main.ts in terminal
// ts-node main.ts

// fetch static data from api api/data/static

import { ItemCategory } from './models/category.model';
import { Item } from './models/item.model';

import { RequestsManager } from './services/requests.manager';
import { ItemCategoryManager } from './services/item-category.manager';
import { FetcherService } from './services/fetcher.service';


const requestsManager: RequestsManager = RequestsManager.instance;
const itemCategoryManager: ItemCategoryManager = ItemCategoryManager.instance;
const fetcherService: FetcherService = FetcherService.instance;

let isRunning: boolean = true;

async function main() {
    // Start the requests manager
    await requestsManager.start();

    // Delay for 10 seconds
    await new Promise((resolve) => setTimeout(resolve, 10_000));

    // Process the static data
    await itemCategoryManager.initialize();

    // Delay for 10 seconds
    await new Promise((resolve) => setTimeout(resolve, 10_000));

    while (isRunning) {
        await fetcherService.startGlobalFetchingProcess();
    }

    // Stop the requests manager
    await requestsManager.stop();
}

main().catch((error) => {
    console.error('Error in main execution:', error);
});