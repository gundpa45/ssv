const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findUnique({
      where: { employeeId: 'ADMIN001' },
      include: { role: true },
    });
    console.log('User ADMIN001 role details:', user ? {
      id: user.id,
      employeeId: user.employeeId,
      roleName: user.role?.name,
    } : 'User not found');
  } catch (error) {
    console.error('Error fetching admin role:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
