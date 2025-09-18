import { serve } from "@hono/node-server";
import { Hono } from "hono";
import snsRoutes from "./routes/webhooks/sns.js";

const app = new Hono();

// Global middleware
// app.use('*', errorMiddleware());
// app.use('*', rawBodyMiddleware());        // gives c.get('rawBody')
// app.use('*', idempotencyMiddleware());    // dedupe via header + Redis/DB

app.route("/hooks/aws/sns", snsRoutes);

// app.get("/", (c) => {
// 	return c.text("Hello Hono!");
// });

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
