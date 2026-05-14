import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const events = await prisma.event.findMany();
  console.log('Events in DB:', JSON.stringify(events, null, 2));
}

main().finally(() => prisma.$disconnect());
