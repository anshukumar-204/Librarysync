// src/db/prisma.ts
import { PrismaClient } from "../generated/client/index.js"; // Use your custom output path
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });
//# sourceMappingURL=prisma.js.map