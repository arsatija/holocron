import {
    getAvailableBilletOptions,
    getBillets,
    getBilletsByUnitElement,
} from "@/services/billets";

const billetOptions = await getBillets();

console.log(billetOptions);

console.log("--------------------------------");

const billetOptionsByUnitElement = await getBilletsByUnitElement(
    "27a0f072-1824-4380-9099-99aea5f16c9c"
);

console.log(billetOptionsByUnitElement);

console.log("--------------------------------");

const availableBilletOptions = await getAvailableBilletOptions();

console.log(availableBilletOptions);
