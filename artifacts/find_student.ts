import { prisma } from '../server/src/db/prisma.js';
import dotenv from 'dotenv';
dotenv.config({ path: '../server/.env' });

async function findStudent() {
  try {
    const student = await prisma.user.findFirst({
      where: { role: 'STUDENT' },
      select: { email: true, mobile: true }
    });
    console.log(JSON.stringify(student));
  } catch (error) {
    console.error(error);
  } finally {
    process.exit(0);
  }
}

findStudent();
