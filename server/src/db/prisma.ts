// src/db/prisma.ts
import { PrismaClient } from "@prisma/client";

import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  keepAlive: true,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  max: 15
});
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });
