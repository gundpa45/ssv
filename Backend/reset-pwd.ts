import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Reset EMP001 password to "sal999" (matching auto-generation: first3 + last3mobile)
  const newPassword = 'sal999';
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { employeeId: 'EMP001' },
    data: { passwordHash: hashedPassword },
  });

  console.log(`Password for EMP001 reset to: ${newPassword}`);
  console.log(`Hash: ${hashedPassword}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
