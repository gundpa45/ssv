const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const count = await prisma.sODepartment.count();
    console.log('SODepartment count:', count);
  } catch (error) {
    console.error('Error querying SODepartment:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
