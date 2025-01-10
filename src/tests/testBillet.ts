import { getBilletInformation } from "@/services/billets";

const startTime1 = performance.now();
const billetInformation = await getBilletInformation(
    "a461b0ed-0123-4d8b-b35f-4078a13b2ca4"
);
const endTime1 = performance.now();
console.log(`getBilletInformation took ${endTime1 - startTime1}ms`);
console.log(billetInformation);
