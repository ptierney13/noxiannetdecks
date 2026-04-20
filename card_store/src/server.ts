import { createApp } from "./api/app.js";
import { loadCards } from "./data/repository.js";

const port = Number(process.env.PORT ?? 4545);
const host = process.env.HOST ?? "127.0.0.1";

const cards = await loadCards();
const app = await createApp({ cards });

await app.listen({ port, host });
console.log(`Card store API listening on http://${host}:${port}`);

