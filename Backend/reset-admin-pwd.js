const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const p = new PrismaClient();

async function resetPassword() {
  const newPassword = 'Admin@123';
  const hash = await bcrypt.hash(newPassword, 10);
  
  const updated = await p.user.update({
    where: { employeeId: 'EMP-1042' },
    data: { passwordHash: hash },
    select: { employeeId: true, firstName: true, email: true }
  });
  
  console.log('Password reset for:', JSON.stringify(updated));
  console.log('New password is:', newPassword);
  await p.$disconnect();
}

resetPassword().catch(e => { console.error(e); p.$disconnect(); });
