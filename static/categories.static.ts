import { ItemCategory } from "../models/category.model";

export const staticCategories = [
    new ItemCategory({
        id: 'currency', 
        knowLabels: ["Currency", "Currencies"],
        displayName: "Currency"
    }),
    new ItemCategory({
        id: 'accessory', 
        knowLabels: ["Accessories", "Accessory"],
        displayName: "Accessories",
        ignored: true
    }),
    new ItemCategory({
        id: 'armour', 
        knowLabels: ["Armours", "Armour"],
        displayName: "Armours",
        ignored: true
    }),
    new ItemCategory({
        id: 'weapon', 
        knowLabels: ["Weapons", "Weapon"],
        displayName: "Weapons",
        ignored: true
    }),
    new ItemCategory({
        id: 'flask', 
        knowLabels: ["Flasks", "Flask"],
        displayName: "Flasks",
        ignored: true
    }),
    new ItemCategory({
        id: 'jewel', 
        knowLabels: ["Jewels", "Jewel"],
        displayName: "Jewels",
        ignored: true
    }),
    new ItemCategory({
        id: 'waystone', 
        knowLabels: ["Maps", "Map", "Waystones", "Waystone", "Waystones & Tablets"],
        displayName: "Waystones"
    }),
    new ItemCategory({
        id: 'gem', 
        knowLabels: ["Gems", "Gem"],
        displayName: "Gems"
    }),
    new ItemCategory({
        id: 'sanctum', 
        knowLabels: ["Sanctum Research", "Relic", "Relics"],
        displayName: "Relics"
    }),
    new ItemCategory({
        id: 'fragment', 
        knowLabels: ["Fragments", "Fragment"],
        displayName: "Fragments"
    }),
    new ItemCategory({
        id: 'rune', 
        knowLabels: ["Runes", "Rune"],
        displayName: "Runes"
    }),
    new ItemCategory({
        id: 'essences', 
        knowLabels: ["Essences", "Essence"],
        displayName: "Essences"
    }),
    new ItemCategory({
        id: 'ultimatum', 
        knowLabels: ["Soul Cores", "Soul Core", "Ultimatum"],
        displayName: "Soul Cores"
    }),
    new ItemCategory({
        id: 'breach', 
        knowLabels: ["BreachCatalyst", "Breach Catalysts", "Breach"],
        displayName: "Breach Catalysts"
    }),
    new ItemCategory({
        id: 'expedition', 
        knowLabels: ["Expedition", "Expedition Coinage & Artifacts"],
        displayName: "Expedition"
    }),
    new ItemCategory({
        id: 'ritual', 
        knowLabels: ["Ritual", "Rituals", "Ritual Omens"],
        displayName: "Ritual Omens"
    }),
    new ItemCategory({
        id: 'delirium', 
        knowLabels: ["DeliriumInstill", "Delirium Distillations"],
        displayName: "Delirium Distillations"
    }),
    new ItemCategory({
        id: 'misc', 
        knowLabels: ["Misc", "null"],
        displayName: "Misc"
    }),
];


export const staticCategoriesMap = staticCategories.reduce((acc, category) => {
    category.knowLabels.forEach(label => {
        acc[label.toLowerCase()] = category;
    });
    return acc;
}, {} as Record<string, ItemCategory>);