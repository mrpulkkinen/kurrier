import { Hono } from "hono";
import type { Context } from "hono";

const sns = new Hono();

// POST /hooks/aws/sns
sns.post("/", async (c: Context) => {
	const raw = await c.req.text(); // SNS often requires raw body
	let msg: any;
	try {
		msg = JSON.parse(raw);
	} catch {
		return c.json({ ok: false, error: "Invalid JSON" }, 400);
	}

	// 1) Confirm subscription
	if (msg.Type === "SubscriptionConfirmation" && msg.SubscribeURL) {
		// Call the SubscribeURL to confirm
		await fetch(msg.SubscribeURL);
		return c.text("OK");
	}

	// 2) Handle notifications
	if (msg.Type === "Notification") {
		// In prod: verify SNS signature here with SigningCertURL
		// msg.Message contains your SES notification payload
		// Example: fetch S3 object, enqueue job, etc.
		console.log("SNS Notification:", msg);

		return c.text("OK");
	}

	// 3) (rare) Unsubscribe confirmation
	if (msg.Type === "UnsubscribeConfirmation") {
		// Optionally handle resubscribe logic
		console.log("Unsubscribed:", msg);
		return c.text("OK");
	}

	return c.text("Ignored", 200);
});

export default sns;
