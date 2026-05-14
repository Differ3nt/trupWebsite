import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const tables = await prisma.$queryRawUnsafe(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`);
  console.log('Tables:', tables);
  
  const columns = await prisma.$queryRawUnsafe(`SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name IN ('Event', 'event')`);
  console.log('Columns:', columns);
}

main().finally(() => prisma.$disconnect());
