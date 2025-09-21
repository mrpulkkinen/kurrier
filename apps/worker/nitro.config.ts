import { defineNitroConfig } from "nitropack/config"

// https://nitro.build/config
export default defineNitroConfig({
  compatibilityDate: "latest",
  srcDir: "server",
  imports: false,
    alias: {
        "@db": "../../packages/db/src/index.ts",
        "@db/*": "../../packages/db/src/*",
        "@schema": "../../packages/schema/src/index.ts",
        "@schema/*": "../../packages/schema/src/*",
        "@providers": "../../packages/providers/src/index.ts",
        "@providers/*": "../../packages/providers/src/*"
    },
    externals: {
        inline: ['@db', '@schema', '@providers']
    },
});
