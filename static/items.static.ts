import { FetchMethod, Item } from "../models/item.model";

export const staticItems: Array<{
    categoryId: string, 
    ignored: boolean,
    item: Item
}> = [
    {
        categoryId: 'misc',
        ignored: false,
        item: new Item({
            id: 'perfect_jewellers_orb',
            baseType: 'Perfect Jeweller\'s Orb',
            fetchMethod: FetchMethod.SEARCH,
            icon: 'https://web.poecdn.com/gen/image/WzI1LDE0LHsiZiI6IjJESXRlbXMvQ3VycmVuY3kvQ3VycmVuY3lSZXJvbGxTb2NrZXROdW1iZXJzMDMiLCJ3IjoxLCJoIjoxLCJzY2FsZSI6MSwicmVhbG0iOiJwb2UyIn1d/5fed40edcf/CurrencyRerollSocketNumbers03.png',
            iLvl: 0,
            maxStackSize: 20,
            descrText: ['Right click this item then left click a Skill Gem to apply it.', 'Adds a Support Gem Socket to a Skill Gem with 4 Support Gem Sockets']
        })
    },
    {
        categoryId: 'misc',
        ignored: false,
        item: new Item({
            id: 'greater_jewellers_orb',
            baseType: 'Greater Jeweller\'s Orb',
            fetchMethod: FetchMethod.SEARCH,
            icon: 'https://web.poecdn.com/gen/image/WzI1LDE0LHsiZiI6IjJESXRlbXMvQ3VycmVuY3kvQ3VycmVuY3lSZXJvbGxTb2NrZXROdW1iZXJzMDMiLCJ3IjoxLCJoIjoxLCJzY2FsZSI6MSwicmVhbG0iOiJwb2UyIn1d/5fed40edcf/CurrencyRerollSocketNumbers02.png',
            iLvl: 0,
            maxStackSize: 20,
            descrText: ['Right click this item then left click a Skill Gem to apply it.', 'Adds a Support Gem Socket to a Skill Gem with 3 Support Gem Sockets']
        })
    },
    {
        categoryId: 'misc',
        ignored: false,
        item: new Item({
            id: 'lesser_jewellers_orb',
            baseType: 'Lesser Jeweller\'s Orb',
            fetchMethod: FetchMethod.SEARCH,
            icon: 'https://web.poecdn.com/gen/image/WzI1LDE0LHsiZiI6IjJESXRlbXMvQ3VycmVuY3kvQ3VycmVuY3lSZXJvbGxTb2NrZXROdW1iZXJzMDMiLCJ3IjoxLCJoIjoxLCJzY2FsZSI6MSwicmVhbG0iOiJwb2UyIn1d/5fed40edcf/CurrencyRerollSocketNumbers01.png',
            iLvl: 0,
            maxStackSize: 20,
            descrText: ['Right click this item then left click a Skill Gem to apply it.', 'Adds a Support Gem Socket to a Skill Gem with 2 Support Gem Sockets']
        })
    }
];

