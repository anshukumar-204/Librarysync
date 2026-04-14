import { PrismaClient } from '@prisma/client';
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function run() {
  const args = process.argv.slice(2);
  const attendanceId = parseInt(args[0]);
  const checkOutTimeString = args[1]; // Optional: e.g. "2026-04-13T20:00:00"

  if (isNaN(attendanceId)) {
    console.error("Usage: npx tsx scratch/manual-checkout.ts <attendanceId> [checkOutTime]");
    process.exit(1);
  }

  try {
    const checkOutTime = checkOutTimeString ? new Date(checkOutTimeString) : new Date();

    const updated = await prisma.attendance.update({
      where: { id: attendanceId },
      data: {
        checkOutTime: checkOutTime,
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
      },
    });

    console.log("\n--- CHECK-OUT SUCCESSFUL ---\n");
    console.log(`ID: ${updated.id}`);
    console.log(`Student: ${updated.student.user.name}`);
    console.log(`Check-in: ${updated.checkInTime?.toLocaleString()}`);
    console.log(`Check-out (MANUAL): ${updated.checkOutTime?.toLocaleString()}`);
    console.log("----------------------------");
  } catch (error) {
    console.error("Error performing manual checkout:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

run();
