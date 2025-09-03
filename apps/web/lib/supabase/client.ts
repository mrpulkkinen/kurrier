import { createBrowserClient } from "@supabase/ssr";
import { getEnv } from "@schema";

export function createClient() {
	const {
		public: { NEXT_PUBLIC_SUPABASE_DOMAIN, NEXT_PUBLIC_SUPABASE_ANON_KEY },
	} = getEnv();

	return createBrowserClient(
		NEXT_PUBLIC_SUPABASE_DOMAIN,
		NEXT_PUBLIC_SUPABASE_ANON_KEY,
	);
}
