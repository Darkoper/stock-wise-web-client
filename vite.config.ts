import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tsConfigPaths(),
    tailwindcss(),
    tanstackStart({
      client: { entry: "client" },
      server: { entry: "server" },
    }),
    nitro(),
    viteReact(),
  ],
  server: {
    host: "0.0.0.0",
    port: 3000,
  },
});
