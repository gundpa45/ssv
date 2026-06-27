const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const userCount = await prisma.user.count();
    const roleCount = await prisma.role.count();
    const deptCount = await prisma.department.count();
    const actCount = await prisma.activity.count();
    const soCount = await prisma.salesOrder.count();
    const logCount = await prisma.activityLog.count();

    console.log({
      userCount,
      roleCount,
      deptCount,
      actCount,
      soCount,
      logCount
    });

    const roles = await prisma.role.findMany();
    console.log('Roles:', roles);

    const users = await prisma.user.findMany({ include: { role: true } });
    console.log('Users:', users);

  } catch (error) {
    console.error('Error querying DB:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
