import 'dotenv/config';
import { prisma } from './src/db/prisma.js';

async function main() {
  try {
    const user12 = await prisma.user.findUnique({
        where: { id: 12 },
        include: { student: true }
    });
    console.log("User 12's Student ID is:", user12?.student?.id);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect()
  }
}

main();
