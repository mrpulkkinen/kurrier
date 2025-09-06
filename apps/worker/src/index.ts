import { serve } from "@hono/node-server";
import { Hono } from "hono";
import seed from "@worker/lib/seed.js";
await seed();

const app = new Hono();

app.get("/", (c) => {
	return c.text("Hello Hono!");
});

const port = Number(process.env.WORKER_PORT ?? 3001);

serve(
	{
		fetch: app.fetch,
		port,
	},
	(info) => {
		console.log(`Server is running on http://localhost:${info.port}`);
	},
);
