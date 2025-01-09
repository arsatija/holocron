import { getBilletInformation } from "@/app/trooper/[id]/queries";
import { getBilletInformation as getBilletInformation2 } from "@/services/billets";

const startTime1 = performance.now();
const billetInformation = await getBilletInformation(
    "a461b0ed-0123-4d8b-b35f-4078a13b2ca4"
);
const endTime1 = performance.now();
console.log(`getBilletInformation took ${endTime1 - startTime1}ms`);

const startTime2 = performance.now();
const billetInformation2 = await getBilletInformation2(
    "a461b0ed-0123-4d8b-b35f-4078a13b2ca4"
);
const endTime2 = performance.now();
console.log(`getBilletInformation2 took ${endTime2 - startTime2}ms`);

console.log(billetInformation);
console.log(billetInformation2);
