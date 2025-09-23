// apps/web/app/api/v1/hooks/aws/sns/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
	const rawBody = await req.text(); // SNS often requires raw body
	let msg: any;

	try {
		msg = JSON.parse(rawBody);
	} catch (err) {
		return NextResponse.json(
			{ ok: false, error: "Invalid JSON" },
			{ status: 400 },
		);
	}


	// 1) Confirm subscription
	if (msg.Type === "SubscriptionConfirmation" && msg.SubscribeURL) {
		try {
			await fetch(msg.SubscribeURL); // confirm
		} catch (err) {
			console.error("Failed to confirm SNS subscription", err);
			return NextResponse.json({ ok: false }, { status: 500 });
		}
		return NextResponse.json({ ok: true, action: "SubscriptionConfirmed" });
	}

	// 2) Handle notifications
	if (msg.Type === "Notification") {
		// Optionally: verify the SNS signature here (recommended in prod)
		// msg.Message will contain your payload (RawMessageDelivery = true)
		console.log("SNS Notification:", msg.Message);

		// Example: store in Supabase or enqueue job
		// await db.insert(inboundEvents).values({ payload: msg.Message });

		return NextResponse.json({ ok: true, action: "NotificationHandled" });
	}

	// 3) Handle unsubscribe (rare)
	if (msg.Type === "UnsubscribeConfirmation") {
		console.warn("SNS Unsubscribed:", msg);
		return NextResponse.json({ ok: true, action: "Unsubscribed" });
	}

	return NextResponse.json({ ok: true, action: "Ignored" });
}
