import { getBilletInformation } from "@/services/billets";
import { getTrooper, getTrooperRank } from "@/services/troopers";

const trooperId = "3f210a82-7c9f-4579-9589-cc23f1e7b78f";

const trooperRank = await getTrooperRank(trooperId);

console.log("trooperRank", trooperRank);

const trooper = await getTrooper(trooperId);

const billetInformation = await getBilletInformation(trooperId);

console.log("trooper", trooper);
console.log("billetInformation", billetInformation);
