import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: import.meta.env.VERCEL ? "/" : "/Level_Up_Portal/",
  plugins: [react()],
});
