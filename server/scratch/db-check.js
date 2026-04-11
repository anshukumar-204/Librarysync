import { prisma } from "../src/db/prisma.js";
import dotenv from "dotenv";
dotenv.config();

async function check() {
  try {
    const admin = await prisma.user.findFirst({
      where: { role: "admin" }
    });
    console.log("Admin email:", admin?.email);
    console.log("All admins:", await prisma.user.findMany({ where: { role: "admin" } }));
  } catch (e) {
    console.error("DB Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}

check();
