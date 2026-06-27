const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

async function main() {
  const prisma = new PrismaClient();
  try {
    console.log('Starting full database seed...');

    // Truncate tables with relations to ensure clean 3-role state
    console.log('Truncating tables...');
    await prisma.activitySlot.deleteMany();
    await prisma.activityAttachment.deleteMany();
    await prisma.activityCoworker.deleteMany();
    await prisma.activityLog.deleteMany();
    await prisma.sODepartmentActivity.deleteMany();
    await prisma.sODepartment.deleteMany();
    await prisma.salesOrder.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.user.deleteMany();
    await prisma.roleActivity.deleteMany();
    await prisma.role.deleteMany();

    // 1. Seed Roles
    const roleNames = ['Admin', 'Skilled', 'Trainee'];
    const roles = {};
    for (const name of roleNames) {
      roles[name] = await prisma.role.create({
        data: {
          name,
          description: `${name} role`,
          isActive: true,
          isDeleted: false,
        },
      });
    }
    console.log('Roles seeded successfully.');

    // 2. Seed Users
    const passwordHash = await bcrypt.hash('Admin@123', 10);
    const admin001Hash = await bcrypt.hash('SYS001', 10);

    const baseUsersData = [
      { employeeId: 'ADMIN001', firstName: 'System', lastName: 'Admin', mobile: '9000000001', email: 'systemadmin@workforce.com', role: 'Admin', hash: admin001Hash },
      { employeeId: 'EMP-1042', firstName: 'Admin', lastName: 'User', mobile: '9876543210', email: 'admin@workforce.com', role: 'Admin', hash: passwordHash },
      { employeeId: 'EMP-2001', firstName: 'Anita', lastName: 'Sharma', mobile: '9876543211', email: 'anita@workforce.com', role: 'Skilled', hash: passwordHash },
      { employeeId: 'EMP-1990', firstName: 'Harshada', lastName: 'Amrolkar', mobile: '4548512121', email: 'harshada@workforce.com', role: 'Skilled', hash: passwordHash },
      { employeeId: 'EMP-2003', firstName: 'Saloni', lastName: 'More', mobile: '7852446876', email: 'saloni@workforce.com', role: 'Trainee', hash: passwordHash },
      { employeeId: 'EMP-2002', firstName: 'Samarth', lastName: 'Anandrao', mobile: '7258945612', email: 'samarth@workforce.com', role: 'Trainee', hash: passwordHash },
      { employeeId: 'MGR001', firstName: 'Kavita', lastName: 'Reddy', mobile: '9876543225', email: 'kavita@workforce.com', role: 'Trainee', hash: passwordHash },
      { employeeId: 'SUPER001', firstName: 'Vikram', lastName: 'Singh', mobile: '9876543224', email: 'vikram@workforce.com', role: 'Trainee', hash: passwordHash },
      { employeeId: 'TRAINEE002', firstName: 'Sunita', lastName: 'Rao', mobile: '9876543223', email: 'sunita@workforce.com', role: 'Trainee', hash: passwordHash },
      { employeeId: 'SKILLED002', firstName: 'Amit', lastName: 'Patel', mobile: '9876543222', email: 'amit@workforce.com', role: 'Skilled', hash: passwordHash },
      { employeeId: 'TRAINEE001', firstName: 'Priya', lastName: 'Sharma', mobile: '9876543221', email: 'priya@workforce.com', role: 'Trainee', hash: passwordHash },
      { employeeId: 'SKILLED001', firstName: 'Rajesh', lastName: 'Kumar', mobile: '9876543220', email: 'rajesh@workforce.com', role: 'Skilled', hash: passwordHash },
    ];

    const extraUsersData = [
      { employeeId: 'FTC016', firstName: 'SHASHANK', lastName: 'MAPANKAR', mobile: '9819645785', pass: 'SHA785', role: 'Skilled' },
      { employeeId: 'FTC039', firstName: 'SANJAY', lastName: 'PARAB', mobile: '9820691714', pass: 'SAN714', role: 'Skilled' },
      { employeeId: 'FTC038', firstName: 'DINESH', lastName: 'SHIGWAN', mobile: '8369614690', pass: 'DIN690', role: 'Skilled' },
      { employeeId: 'FTC033', firstName: 'VISHVAJIT', lastName: 'LINGAYAT', mobile: '8369192042', pass: 'VIS042', role: 'Skilled' },
      { employeeId: 'FTC002', firstName: 'SUHAS', lastName: 'BALIP', mobile: '9821825044', pass: 'SUH044', role: 'Skilled' },
      { employeeId: 'FTC014', firstName: 'BHARAT', lastName: 'JADHAV', mobile: '7021600762', pass: 'BHA762', role: 'Skilled' },
      { employeeId: 'FTC0012', firstName: 'SATISH', lastName: 'RANE', mobile: '9867180614', pass: 'SAT614', role: 'Skilled' },
      { employeeId: 'FTC003', firstName: 'SHASHIKAN', lastName: 'GUPTA', mobile: '9029440502', pass: 'SHA502', role: 'Skilled' },
      { employeeId: 'FTC056', firstName: 'SAGAR', lastName: 'PAWAR', mobile: '7769941140', pass: 'SAG140', role: 'Skilled' },
      { employeeId: 'FTC028', firstName: 'Sanket', lastName: 'Manchekar', mobile: '750620993', pass: 'SAN993', role: 'Skilled' },
      { employeeId: 'FTC085', firstName: 'Tejas', lastName: 'Dhukhande', mobile: '8169825345', pass: 'TEJ345', role: 'Skilled' },
    ];

    const usersData = [...baseUsersData];
    for (const u of extraUsersData) {
      const hash = await bcrypt.hash(u.pass, 10);
      usersData.push({
        employeeId: u.employeeId,
        firstName: u.firstName,
        lastName: u.lastName,
        mobile: u.mobile,
        email: null,
        role: u.role,
        hash
      });
    }

    const users = {};
    for (const u of usersData) {
      users[u.employeeId] = await prisma.user.upsert({
        where: { employeeId: u.employeeId },
        update: {
          firstName: u.firstName,
          lastName: u.lastName,
          mobile: u.mobile,
          email: u.email,
          roleId: roles[u.role].id,
          passwordHash: u.hash,
          isActive: true,
          isDeleted: false,
        },
        create: {
          employeeId: u.employeeId,
          firstName: u.firstName,
          lastName: u.lastName,
          mobile: u.mobile,
          email: u.email,
          roleId: roles[u.role].id,
          passwordHash: u.hash,
          isActive: true,
          isDeleted: false,
        },
      });
    }
    console.log('Users seeded successfully.');

    // 3. Seed Departments & Activities
    const departmentsData = [
      { name: 'Assembly', code: 'ASM', desc: 'Mechanical and electrical assembly division', activities: [
        { name: 'Frame Assembly', minutes: 45 },
        { name: 'Wiring Harness Install', minutes: 30 },
        { name: 'Mechanical Assembly', minutes: 60 },
        { name: 'Final Assembly', minutes: 90 },
      ]},
      { name: 'Quality Control', code: 'QC', desc: 'Inspection, standards testing, and validation', activities: [
        { name: 'Visual Inspection', minutes: 15 },
        { name: 'Quality Check', minutes: 20 },
        { name: 'Functional Testing', minutes: 40 },
      ]},
      { name: 'Welding', code: 'WLD', desc: 'Structural metal joining and welding operations', activities: [
        { name: 'TIG Welding', minutes: 50 },
        { name: 'MIG Welding', minutes: 40 },
        { name: 'Spot Welding', minutes: 25 },
        { name: 'Welding Area Cleanup', minutes: 15 },
      ]},
      { name: 'Painting', code: 'PNT', desc: 'Surface prep, primer, basecoat, and topcoat clear finishing', activities: [
        { name: 'Surface Prep & Sanding', minutes: 30 },
        { name: 'Primer Application', minutes: 25 },
        { name: 'Basecoat Painting', minutes: 40 },
        { name: 'Clearcoat Application', minutes: 35 },
      ]},
      { name: 'Engineering', code: 'ENG', desc: 'CAD design, drafting, prototyping, and design integrations', activities: [
        { name: 'CAD Modeling', minutes: 120 },
        { name: 'Prototyping', minutes: 180 },
        { name: 'Code Integration', minutes: 60 },
      ]},
      { name: 'Design', code: 'DSN', desc: 'UI/UX mockups, graphics, themes, and presentation decks', activities: [
        { name: 'UI UX Mockup', minutes: 90 },
        { name: 'Schematic Drafting', minutes: 80 },
      ]},
      { name: 'Operations', code: 'OPS', desc: 'Logistics, process optimization, scheduling, and admin workflows', activities: [
        { name: 'Process Planning', minutes: 60 },
        { name: 'Inventory Check', minutes: 45 },
      ]},
      { name: 'Sales', code: 'SLS', desc: 'Client acquisition, pitches, CRM updates, and order generation', activities: [
        { name: 'Client Presentation', minutes: 45 },
        { name: 'Order Logging', minutes: 30 },
      ]},
      { name: 'Support', code: 'SPT', desc: 'Customer ticket support, troubleshooting, and field feedback', activities: [
        { name: 'Customer Assistance', minutes: 30 },
        { name: 'Troubleshooting', minutes: 40 },
      ]},
    ];

    const departments = {};
    const activities = {};

    for (const d of departmentsData) {
      const dept = await prisma.department.upsert({
        where: { code: d.code },
        update: { name: d.name, description: d.desc, isActive: true, isDeleted: false },
        create: {
          name: d.name,
          code: d.code,
          description: d.desc,
          isActive: true,
          isDeleted: false,
        },
      });
      departments[d.name] = dept;

      activities[d.name] = {};
      for (const a of d.activities) {
        const act = await prisma.activity.findFirst({
          where: { activityName: a.name, departmentId: dept.id },
        });

        if (act) {
          activities[d.name][a.name] = await prisma.activity.update({
            where: { id: act.id },
            data: { standardManMinutes: a.minutes, isActive: true, isDeleted: false },
          });
        } else {
          activities[d.name][a.name] = await prisma.activity.create({
            data: {
              activityName: a.name,
              standardManMinutes: a.minutes,
              departmentId: dept.id,
              isActive: true,
              isDeleted: false,
            },
          });
        }
      }
    }
    console.log('Departments & Activities seeded successfully.');

    // 4. Seed Sales Orders
    const salesOrdersData = [
      {
        soNumber: 'SO-2025-001',
        customerName: 'AERO DYNAMICS INC',
        projectName: 'Chassis Frame Assembly',
        soDescription: 'Primary chassis frame building and verification',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        status: 'IN_PROGRESS',
        mappings: [
          { dept: 'Assembly', acts: ['Frame Assembly', 'Wiring Harness Install'] },
          { dept: 'Quality Control', acts: ['Visual Inspection', 'Quality Check'] },
          { dept: 'Welding', acts: ['Welding Area Cleanup'] },
          { dept: 'Painting', acts: ['Surface Prep & Sanding'] },
        ],
      },
      {
        soNumber: 'SO-2025-002',
        customerName: 'TITANIUM LABS',
        projectName: 'Control Panel Assembly',
        soDescription: 'Electrical and electronics harness installation',
        startDate: new Date('2025-02-01'),
        endDate: new Date('2025-10-31'),
        status: 'IN_PROGRESS',
        mappings: [
          { dept: 'Assembly', acts: ['Wiring Harness Install'] },
          { dept: 'Quality Control', acts: ['Visual Inspection'] },
        ],
      },
      {
        soNumber: 'SO-2025-003',
        customerName: 'GLOBAL HEAVY INDUSTRIES',
        projectName: 'Heavy Structure Fabrication',
        soDescription: 'Arc welding and grinding tasks',
        startDate: new Date('2025-03-01'),
        endDate: new Date('2025-09-30'),
        status: 'IN_PROGRESS',
        mappings: [
          { dept: 'Welding', acts: ['Welding Area Cleanup'] },
          { dept: 'Quality Control', acts: ['Visual Inspection'] },
        ],
      },
    ];

    const salesOrders = {};
    for (const sod of salesOrdersData) {
      const so = await prisma.salesOrder.upsert({
        where: { soNumber: sod.soNumber },
        update: {
          customerName: sod.customerName,
          projectName: sod.projectName,
          soDescription: sod.soDescription,
          startDate: sod.startDate,
          endDate: sod.endDate,
          status: sod.status,
          isActive: true,
          isDeleted: false,
        },
        create: {
          soNumber: sod.soNumber,
          customerName: sod.customerName,
          projectName: sod.projectName,
          soDescription: sod.soDescription,
          startDate: sod.startDate,
          endDate: sod.endDate,
          status: sod.status,
          isActive: true,
          isDeleted: false,
        },
      });
      salesOrders[sod.soNumber] = so;

      // Create SODepartment & SODepartmentActivity mappings
      for (const m of sod.mappings) {
        const dept = departments[m.dept];
        const soDept = await prisma.sODepartment.upsert({
          where: { soId_departmentId: { soId: so.id, departmentId: dept.id } },
          update: {},
          create: {
            soId: so.id,
            departmentId: dept.id,
          },
        });

        for (const actName of m.acts) {
          const act = activities[m.dept][actName];
          await prisma.sODepartmentActivity.upsert({
            where: { soDepartmentId_activityId: { soDepartmentId: soDept.id, activityId: act.id } },
            update: {},
            create: {
              soDepartmentId: soDept.id,
              activityId: act.id,
            },
          });
        }
      }
    }
    console.log('Sales Orders and mapping relationships seeded successfully.');

    // 5. Seed Activity Logs & Slots (to show historical productivity on dashboard charts)
    // We will delete existing logs to ensure clean mock tracking
    await prisma.activitySlot.deleteMany();
    await prisma.activityAttachment.deleteMany();
    await prisma.activityCoworker.deleteMany();
    await prisma.activityLog.deleteMany();

    const loggedUsers = ['EMP-2001', 'EMP-1990', 'EMP-2003', 'EMP-2002'];
    const activeSO = salesOrders['SO-2025-001'];
    const deptAssembly = departments['Assembly'];
    const actFrame = activities['Assembly']['Frame Assembly'];

    const logDates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      logDates.push(d);
    }

    console.log('Seeding activity logs and productivity trends...');
    for (let i = 0; i < logDates.length; i++) {
      const date = logDates[i];
      // Create some logs for each day
      for (const empId of loggedUsers) {
        const user = users[empId];
        
        // Log frame assembly
        const log = await prisma.activityLog.create({
          data: {
            userId: user.id,
            soId: activeSO.id,
            departmentId: deptAssembly.id,
            activityId: actFrame.id,
            activityDate: date,
            status: 'COMPLETED',
            remarks: 'Seeded completed activity task log.',
            isOtherActivity: false,
          },
        });

        // Add a slot with duration
        // standard time is 45 mins. Let's make actual duration vary to show productivity (90% - 100%)
        const durationMinutes = 40 + Math.floor(Math.random() * 15); // 40 to 55 minutes
        await prisma.activitySlot.create({
          data: {
            activityLogId: log.id,
            startTime: new Date(date.setHours(9, 0, 0)),
            endTime: new Date(date.setHours(9, durationMinutes, 0)),
            durationMinutes,
          },
        });
      }
    }

    console.log('Activity logs and productivity trend data seeded successfully.');
    console.log('Full Database Seeding Complete. Everything aligned neatly!');

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
