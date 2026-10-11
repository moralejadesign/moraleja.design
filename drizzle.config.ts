import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// drizzle-kit doesn't read Next's env files on its own
config({ path: ".env.local" });

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
