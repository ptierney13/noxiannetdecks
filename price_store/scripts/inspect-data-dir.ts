import { resolvePriceDataLayout } from "../src/index.js";

const layout = resolvePriceDataLayout();

console.log(JSON.stringify(layout, null, 2));
