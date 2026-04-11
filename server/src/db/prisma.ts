// src/db/prisma.ts
import { PrismaClient } from "@prisma/client";

import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  keepAlive: true,
  idleTimeoutMillis: 60000,      // Increased to 60s for cloud stability
  connectionTimeoutMillis: 20000, // Increased to 20s for slow cloud cold starts
  max: 10,                       // Reduced max connections for Supabase Free/Starter tiers
});

pool.on('error', (err) => {
  console.error('[DATABASE] Unexpected error on idle client', err);
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });
