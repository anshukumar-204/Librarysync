import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DIRECT_URL"), // Use direct connection for Prisma CLI (migrations)
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
