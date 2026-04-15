const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: { sessions: true }
  });
  
  console.log(JSON.stringify(users.map(u => ({
    id: u.id,
    email: u.email,
    sessionsCount: u.sessions.length,
    role: u.role
  })), null, 2));

  const allSessions = await prisma.userSession.findMany();
  console.log("Total sessions:", allSessions.length);
  if (allSessions.length > 0) {
     console.log("Sample session:", allSessions[0]);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  });
