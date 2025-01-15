// Start command for main.ts in terminal
// ts-node main.ts

// fetch static data from api api/data/static

import { AxiosRequestConfig } from 'axios';
import { RequestResponse, RequestsManager } from './services/requests.manager';
import { DatabaseManager } from './databases/database.manager';

interface ItemCategory {
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

    const itemCategories: ItemCategory[] = staticItemsData.response.data.result;
    
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
        await dataProcess();
    }

    // Stop the requests manager
    await requestsManager.stop();
}

main().catch((error) => {
    console.error('Error in main execution:', error);
});