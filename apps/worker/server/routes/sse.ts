import { defineEventHandler, createEventStream } from "h3";
import { createClient } from "../../server/utils/create-client";
import { registerConn, unregisterConn } from "../../server/utils/sse-utils";

export default defineEventHandler(async (event) => {
	const supabase = await createClient(event);
	const { data, error } = await supabase.auth.getUser();
	if (error || !data.user) {
		event.node.res.statusCode = 401;
		return "Unauthorized";
	}

	const userId = data.user.id;
	const stream = createEventStream(event);

	registerConn(userId, stream);

	// example: send initial "ready" event
	stream.push(`event: ready\ndata: ${JSON.stringify({ userId })}\n\n`);

	// heartbeat so connection isn’t dropped
	const keepalive = setInterval(() => {
		stream.push(`: keepalive ${Date.now()}\n\n`);
	}, 25_000);

	stream.onClosed(async () => {
		clearInterval(keepalive);
		unregisterConn(userId, stream);
		await stream.close();
	});

	return stream.send();
});

// import {createEventStream, defineEventHandler} from "h3";
//
// export default defineEventHandler(async (event) => {
//     const eventStream = createEventStream(event)
//
//     const interval = setInterval(async () => {
//         await eventStream.push(`Message @ ${new Date().toLocaleTimeString()}`)
//     }, 1000)
//
//     eventStream.onClosed(async () => {
//         clearInterval(interval)
//         await eventStream.close()
//     })
//
//     return eventStream.send()
// })

// import {
//     defineEventHandler,
//     createEventStream, getQuery,
// } from 'h3';
// import {createClient} from "../../server/utils/create-client";
// // import {registerConn, unregisterConn} from "../../server/utils/sse-utils";
//
// export default defineEventHandler(async (event) => {
//     const supabase = await createClient(event)
//
//     const { data, error } = await supabase.auth.getUser();
//     if (error || !data.user) {
//         event.node.res.statusCode = 401;
//         return 'Unauthorized';
//     }
//
//     const user = data.user;
//     const userId = data.user.id
//     // const { mailboxId } = getQuery(event) as { mailboxId?: string }
//
//     console.log("userId", userId)
//
//     const stream = createEventStream(event);
//     // const conn = { stream, filters: { mailboxId: mailboxId ?? null } }
//     // registerConn(userId, conn)
//     // const keepalive = setInterval(() => stream.push(`: keepalive ${Date.now()}\n\n`), 25_000)
//
//     // await stream.push(`event: ready\ndata: ${JSON.stringify({ userId, mailboxId: mailboxId ?? null })}\n\n`)
//
//
//     const t = setInterval(() => {
//         stream.push(`event: ping\ndata: ${JSON.stringify({ userId: user.id, at: Date.now() })}\n\n`);
//     }, 1000);
//
//     stream.onClosed(async () => {
//         clearInterval(t);
//         await stream.close();
//
//         // clearInterval(keepalive)
//         // unregisterConn(userId, conn)
//         await stream.close()
//     });
//
//     return stream.send();
// });
