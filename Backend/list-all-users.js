const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const users = await prisma.user.findMany({
      include: { role: true }
    });
    console.log(`Total users found: ${users.length}`);
    users.forEach(u => {
      console.log(`- ${u.employeeId} (${u.firstName} ${u.lastName}), Role: ${u.role?.name}`);
    });
  } catch (error) {
    console.error('Error fetching users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
