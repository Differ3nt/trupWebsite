import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Testing findUnique for User...');
    const users = await prisma.user.findMany({ take: 1 });
    if (users.length === 0) {
      console.log('No users found in DB');
      return;
    }
    const userId = users[0].id;
    console.log('Found user ID:', userId);
    
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    console.log('Result:', JSON.stringify(user, null, 2));
  } catch (e) {
    console.error('CRASH:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
