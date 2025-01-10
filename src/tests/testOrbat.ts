import * as queries from "@/app/orbat/_lib/queries";

const startTime1 = performance.now();
const orbatData = await queries.getOrbat();
const endTime1 = performance.now();
console.log(`getUnitElements took ${endTime1 - startTime1}ms`);
console.log("orbatData", orbatData);
console.log("--------------------------------");
