const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { employeeId: 'ADMIN001' },
          { id: '21eea44b-6e13-41d3-ad43-6e180997592b' }
        ]
      },
      include: { role: true },
    });
    console.log('User role details:', user ? {
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
