import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { hashPassword } from "../utils/security.js";
import dotenv from "dotenv";

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function initAdmin() {
  const adminEmail = "sandeep08611@gmail.com";
  const adminPassword = "Sandeep086@";
  const adminMobile = "6287868372"; // Using user's mobile from previous error for consistency

  try {
    console.log(`Ensuring Admin exists with email: ${adminEmail}`);

    const passwordHash = await hashPassword(adminPassword);

    // Upsert the Admin user
    const admin = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        name: "System Admin",
        mobile: adminMobile,
        passwordHash: passwordHash,
        role: "admin",
        status: "active",
        emailVerified: true
      },
      create: {
        name: "System Admin",
        email: adminEmail,
        mobile: adminMobile,
        passwordHash: passwordHash,
        role: "admin",
        status: "active",
        emailVerified: true
      }
    });

    console.log(`Admin user successfully initialized: ${admin.email}`);
  } catch (error) {
    console.error("CRITICAL: Admin initialization failed!");
    console.error(error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

initAdmin();
