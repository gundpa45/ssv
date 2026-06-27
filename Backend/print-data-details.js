const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const depts = await prisma.department.findMany({ where: { isDeleted: false } });
    console.log('Departments:', depts.map(d => ({ id: d.id, name: d.name, code: d.code })));

    const acts = await prisma.activity.findMany({ where: { isDeleted: false }, include: { department: true } });
    console.log('Activities:', acts.map(a => ({ id: a.id, name: a.activityName, dept: a.department.name })));

    const sos = await prisma.salesOrder.findMany({ where: { isDeleted: false } });
    console.log('Sales Orders:', sos.map(s => ({ id: s.id, soNumber: s.soNumber, customerName: s.customerName, status: s.status })));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
