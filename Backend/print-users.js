const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const users = await prisma.user.findMany({
      include: { role: true }
    });
    console.log('All users in DB:', users.map(u => ({
      id: u.id,
      employeeId: u.employeeId,
      firstName: u.firstName,
      roleName: u.role?.name,
    })));
  } catch (error) {
    console.error('Error printing users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
