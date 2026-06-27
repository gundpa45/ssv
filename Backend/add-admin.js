const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

// Configuration - Edit these values to change or add an admin
const adminConfig = {
  employeeId: 'ADMIN002',            // Change to your desired Admin ID (case-sensitive)
  password: 'NewAdminPassword123!',  // Change to your desired password
  firstName: 'New',
  lastName: 'Admin',
  mobile: '9999999999',
  email: 'newadmin@workforce.com'
};

async function main() {
  const prisma = new PrismaClient();
  try {
    console.log(`Checking Admin role...`);
    const adminRole = await prisma.role.findFirst({
      where: { name: 'Admin' }
    });

    if (!adminRole) {
      console.error('Error: "Admin" role does not exist in the database. Run seed first.');
      return;
    }

    const hashedPassword = await bcrypt.hash(adminConfig.password, 10);

    console.log(`Adding or updating Admin User: ${adminConfig.employeeId}...`);
    const user = await prisma.user.upsert({
      where: { employeeId: adminConfig.employeeId },
      update: {
        firstName: adminConfig.firstName,
        lastName: adminConfig.lastName,
        mobile: adminConfig.mobile,
        email: adminConfig.email,
        passwordHash: hashedPassword,
        roleId: adminRole.id,
        isActive: true,
        isDeleted: false,
      },
      create: {
        employeeId: adminConfig.employeeId,
        firstName: adminConfig.firstName,
        lastName: adminConfig.lastName,
        mobile: adminConfig.mobile,
        email: adminConfig.email,
        passwordHash: hashedPassword,
        roleId: adminRole.id,
        isActive: true,
        isDeleted: false,
      }
    });

    console.log(`\nSuccess! Admin user created/updated successfully:`);
    console.log(`- Employee ID: ${user.employeeId}`);
    console.log(`- Role: Admin`);
    console.log(`- Password set to: ${adminConfig.password}`);

  } catch (error) {
    console.error('Error adding admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
