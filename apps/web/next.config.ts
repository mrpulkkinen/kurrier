import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	/* config options here */
	devIndicators: false,
	output: "standalone",
	async rewrites() {
		return [
			{ source: "/api/v1/sse", destination: "http://localhost:3001/sse" },
			{
				source: "/api/v1/mailbox-search",
				destination: "http://localhost:3001/api/v1/mailbox-search",
			},
		];
	},
};

export default nextConfig;
