import { getRanks } from "@/services/ranks";

const ranks = await getRanks();

console.log(ranks);
