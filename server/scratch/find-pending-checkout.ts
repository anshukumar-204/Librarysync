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
  try {
    const pending = await prisma.attendance.findMany({
      where: {
        checkOutTime: null,
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    console.log("\n--- PENDING CHECK-OUTS ---\n");
    if (pending.length === 0) {
      console.log("No students are currently checked in.");
    } else {
      pending.forEach((record) => {
        console.log(`ID: ${record.id}`);
        console.log(`Student: ${record.student.user.name} (${record.student.user.mobile})`);
        console.log(`Check-in: ${record.checkInTime?.toLocaleString()}`);
        console.log(`Date: ${record.date.toDateString()}`);
        console.log("----------------------------");
      });
    }
  } catch (error) {
    console.error("Error fetching pending checkouts:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

run();
