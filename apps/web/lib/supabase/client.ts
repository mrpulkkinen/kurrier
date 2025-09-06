import { createBrowserClient } from "@supabase/ssr";
import {PublicConfig} from "@schema";

export function createClient(publicConfig: PublicConfig) {

	return createBrowserClient(
        publicConfig.SUPABASE_DOMAIN,
        publicConfig.SUPABASE_ANON_KEY,
	);
}
