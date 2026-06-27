const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    console.log('Audit Logs:', logs.map(l => ({
      id: l.id,
      module: l.module,
      action: l.action,
      entityId: l.entityId,
      createdAt: l.createdAt
    })));
  } catch (error) {
    console.error('Error fetching audit logs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
