import { prisma } from './src/db/prisma.js';

async function main() {
  const allSessions = await prisma.userSession.findMany();
  console.log("Total sessions:", allSessions.length);
  if (allSessions.length > 0) {
     console.log("Sample sessions:", JSON.stringify(allSessions.slice(0, 3), null, 2));
  } else {
     console.log("NO SESSIONS IN DATABASE.");
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  });
