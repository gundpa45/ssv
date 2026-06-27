const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

async function main() {
  const prisma = new PrismaClient();
  try {
    console.log('Starting safe role alignment seed...');

    // 1. Ensure the 3 roles exist
    const roleNames = ['Admin', 'Skilled', 'Trainee'];
    const roles = {};
    for (const name of roleNames) {
      roles[name] = await prisma.role.upsert({
        where: { name },
        update: { isActive: true, isDeleted: false },
        create: {
          name,
          description: `${name} role`,
          isActive: true,
          isDeleted: false,
        },
      });
    }
    console.log('Ensure roles created:', Object.keys(roles));

    // 2. Fetch all users
    const users = await prisma.user.findMany({
      include: { role: true }
    });

    console.log(`Found ${users.length} users in database. Aligning roles...`);

    // 3. Align users to the 3 roles
    for (const user of users) {
      let targetRole = 'Trainee';
      const currentRoleName = user.role?.name || '';
      
      if (currentRoleName.toLowerCase() === 'admin') {
        targetRole = 'Admin';
      } else if (currentRoleName.toLowerCase() === 'skilled') {
        targetRole = 'Skilled';
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          roleId: roles[targetRole].id,
        }
      });
      console.log(`- User ${user.employeeId} mapped to role: ${targetRole}`);
    }

    // 4. Safely delete any other roles
    const deletedRoles = await prisma.role.deleteMany({
      where: {
        name: {
          notIn: ['Admin', 'Skilled', 'Trainee']
        }
      }
    });
    console.log(`Deleted ${deletedRoles.count} old roles.`);

    // 5. Reset admin (EMP-1042) password to 'Admin@123'
    const adminUser = users.find(u => u.employeeId === 'EMP-1042');
    if (adminUser) {
      const hash = await bcrypt.hash('Admin@123', 10);
      await prisma.user.update({
        where: { employeeId: 'EMP-1042' },
        data: { passwordHash: hash }
      });
      console.log('Reset EMP-1042 password successfully to: Admin@123');
    } else {
      // Create EMP-1042 Admin user if it doesn't exist
      const hash = await bcrypt.hash('Admin@123', 10);
      await prisma.user.create({
        data: {
          employeeId: 'EMP-1042',
          firstName: 'Admin',
          lastName: 'User',
          mobile: '9876543210',
          email: 'admin@workforce.com',
          roleId: roles['Admin'].id,
          passwordHash: hash,
          isActive: true,
          isDeleted: false,
        }
      });
      console.log('Created EMP-1042 Admin user successfully with password: Admin@123');
    }

  } catch (error) {
    console.error('Error during role alignment:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
