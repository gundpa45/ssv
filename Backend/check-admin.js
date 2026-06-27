const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.user.findFirst({
  where: { employeeId: 'EMP-1042' },
  select: { passwordHash: true, employeeId: true, firstName: true, email: true }
}).then(u => {
  console.log(JSON.stringify(u, null, 2));
  return p.$disconnect();
});
