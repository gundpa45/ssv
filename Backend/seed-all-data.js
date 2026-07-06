const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

async function main() {
  const prisma = new PrismaClient();
  try {
    console.log('Starting full enterprise database seed for Transformer Manufacturing Company...');

    // 1. Truncate tables in dependency order
    console.log('Clearing existing data...');
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
    await prisma.activity.deleteMany();
    await prisma.department.deleteMany();

    // 2. Seed Roles
    console.log('Seeding Roles...');
    const roleNames = ['Admin', 'Supervisor', 'Worker'];
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

    // 3. Seed Departments & Activities for Transformer Manufacturing
    console.log('Seeding Transformer Departments & Activities...');
    const transformerDepts = [
      {
        name: 'Winding',
        code: 'WND',
        desc: 'Coil winding for high-voltage (HV) and low-voltage (LV) transformer sections.',
        activities: [
          { name: 'LV Coil Winding', minutes: 180 },
          { name: 'HV Coil Winding', minutes: 240 },
          { name: 'Coil Insulation & Taping', minutes: 90 },
          { name: 'Lead Wire Brazing', minutes: 60 }
        ]
      },
      {
        name: 'Core Assembly',
        code: 'CAS',
        desc: 'Stacking and clamping of magnetic steel core laminations.',
        activities: [
          { name: 'Core Lamination Stacking', minutes: 120 },
          { name: 'Core Yoke Clamping', minutes: 60 },
          { name: 'Core Insulation Check', minutes: 30 }
        ]
      },
      {
        name: 'Assembly',
        code: 'ASM',
        desc: 'Fitting of wound coils onto core legs and soldering structural inter-connections.',
        activities: [
          { name: 'Coil Insertion on Core', minutes: 180 },
          { name: 'Inter-connection Soldering', minutes: 120 },
          { name: 'Cleat & Lead Assembly', minutes: 90 },
          { name: 'Ratio & Resistance Pre-test', minutes: 45 }
        ]
      },
      {
        name: 'Tanking',
        code: 'TNK',
        desc: 'Lowering core-coil assembly into the transformer tank, fitting components, and oil filling.',
        activities: [
          { name: 'Active Part Core-Coil Lowering', minutes: 90 },
          { name: 'Cover Bolt Fastening', minutes: 60 },
          { name: 'Radiator & Conservator Fitting', minutes: 120 },
          { name: 'Transformer Oil Filling', minutes: 180 }
        ]
      },
      {
        name: 'Painting',
        code: 'PNT',
        desc: 'Tank surface sandblasting, priming, epoxy finish painting, and thermal curing.',
        activities: [
          { name: 'Sand Blasting & Cleaning', minutes: 120 },
          { name: 'Primer Paint Coat', minutes: 60 },
          { name: 'Epoxy Finishing Coat', minutes: 90 }
        ]
      },
      {
        name: 'Testing',
        code: 'TST',
        desc: 'Electrical and high-voltage impulse testing of the fully assembled transformer.',
        activities: [
          { name: 'Insulation Resistance Test', minutes: 30 },
          { name: 'Voltage Ratio & Vector Group Test', minutes: 45 },
          { name: 'No-load and Load Loss Test', minutes: 60 },
          { name: 'High Voltage Impulse Test', minutes: 90 }
        ]
      },
      {
        name: 'Quality',
        code: 'QTY',
        desc: 'Quality assurance check gates for raw materials, sub-assemblies, and finished goods.',
        activities: [
          { name: 'Incoming Materials Inspection', minutes: 45 },
          { name: 'Core Stacking Inspection', minutes: 30 },
          { name: 'Final Pre-Dispatch Audit', minutes: 60 }
        ]
      },
      {
        name: 'Packaging',
        code: 'PKG',
        desc: 'Moisture-proof packing, wooden crating, and ancillary box grouping for transport.',
        activities: [
          { name: 'Moisture Barrier Wrapping', minutes: 60 },
          { name: 'Wooden Crate Construction', minutes: 90 },
          { name: 'Accessory Packing', minutes: 45 }
        ]
      },
      {
        name: 'Dispatch',
        code: 'DSP',
        desc: 'Heavy loading using overhead cranes, cargo lashing, and documentation sign-off.',
        activities: [
          { name: 'Crane Loading to Trailer', minutes: 45 },
          { name: 'Lashing & Transit Securing', minutes: 60 },
          { name: 'Shipping Documents Sign-off', minutes: 30 }
        ]
      }
    ];

    const dbDepts = [];
    const dbActs = [];
    const deptActivitiesMap = {}; // deptId -> array of activities

    for (const d of transformerDepts) {
      const dept = await prisma.department.create({
        data: {
          name: d.name,
          code: d.code,
          description: d.desc,
          isActive: true,
          isDeleted: false
        }
      });
      dbDepts.push(dept);
      deptActivitiesMap[dept.id] = [];

      for (const a of d.activities) {
        const act = await prisma.activity.create({
          data: {
            activityName: a.name,
            standardManMinutes: a.minutes,
            departmentId: dept.id,
            isActive: true,
            isDeleted: false
          }
        });
        dbActs.push(act);
        deptActivitiesMap[dept.id].push(act);
      }
    }
    console.log(`Seeded ${dbDepts.length} departments and ${dbActs.length} activities.`);

    // 4. Seed 100 Employees
    console.log('Generating 100 Employees...');
    const defaultPasswordHash = await bcrypt.hash('Admin@123', 10);
    const passHashGeneral = await bcrypt.hash('password123', 10);

    const firstNames = [
      'Rajesh', 'Amit', 'Priya', 'Sunita', 'Suhas', 'Bharat', 'Satish', 'Shashikant', 'Sagar', 'Sanket',
      'Tejas', 'Shashank', 'Sanjay', 'Dinesh', 'Vishvajit', 'Anita', 'Harshada', 'Saloni', 'Samarth', 'Kavita',
      'Vikram', 'Ramesh', 'Suresh', 'Vijay', 'Rahul', 'Sunil', 'Anil', 'Ganesh', 'Mahesh', 'Karan',
      'Arjun', 'Ajay', 'Deepak', 'Sandeep', 'Ravi', 'Manoj', 'Pradeep', 'Prakash', 'Ashok', 'Kishor',
      'Dilip', 'Sudhir', 'Vivek', 'Nitin', 'Abhay', 'Prashant', 'Sachin', 'Sandeep', 'Jitendra', 'Vikash',
      'Aarti', 'Pooja', 'Neha', 'Jyoti', 'Kiran', 'Swati', 'Monika', 'Sneha', 'Rupali', 'Deepali',
      'Santosh', 'Yogesh', 'Amol', 'Sandip', 'Pravin', 'Sachin', 'Chetan', 'Akash', 'Mayur', 'Prasad',
      'Nikhil', 'Rohit', 'Siddharth', 'Aditya', 'Abhishek', 'Varun', 'Aniket', 'Kunal', 'Darshan', 'Gaurav',
      'Harshal', 'Tushar', 'Vaibhav', 'Omkar', 'Sarang', 'Chinmay', 'Sourabh', 'Anant', 'Swapnil', 'Dnyaneshwar'
    ];

    const lastNames = [
      'Kumar', 'Patel', 'Sharma', 'Rao', 'Balip', 'Jadhav', 'Rane', 'Gupta', 'Pawar', 'Manchekar',
      'Dhukhande', 'Mapankar', 'Parab', 'Shigwan', 'Lingayat', 'Amrolkar', 'More', 'Anandrao', 'Reddy', 'Singh',
      'Deshmukh', 'Patil', 'Joshi', 'Kulkarni', 'Chavan', 'Shinde', 'Sawant', 'Suryavanshi', 'Naik', 'Mane',
      'Kamble', 'Bhosale', 'Kadam', 'Tambe', 'Salvi', 'Desai', 'Gawde', 'Mhatre', 'Shetty', 'Shinde'
    ];

    // Seed system users exactly to maintain compatibility with existing logins
    const baseUsers = [
      { employeeId: 'ADMIN001', firstName: 'System', lastName: 'Admin', mobile: '9000000001', email: 'systemadmin@workforce.com', role: 'Admin', subRole: null, passwordHash: defaultPasswordHash },
      { employeeId: 'EMP-1042', firstName: 'Admin', lastName: 'User', mobile: '9876543210', email: 'admin@workforce.com', role: 'Admin', subRole: null, passwordHash: defaultPasswordHash },
      { employeeId: 'EMP-2001', firstName: 'Anita', lastName: 'Sharma', mobile: '9876543211', email: 'anita@workforce.com', role: 'Worker', subRole: 'Skilled', passwordHash: defaultPasswordHash },
      { employeeId: 'EMP-1990', firstName: 'Harshada', lastName: 'Amrolkar', mobile: '4548512121', email: 'harshada@workforce.com', role: 'Worker', subRole: 'Skilled', passwordHash: defaultPasswordHash },
      { employeeId: 'EMP-2003', firstName: 'Saloni', lastName: 'More', mobile: '7852446876', email: 'saloni@workforce.com', role: 'Worker', subRole: 'Trainee', passwordHash: defaultPasswordHash },
      { employeeId: 'EMP-2002', firstName: 'Samarth', lastName: 'Anandrao', mobile: '7258945612', email: 'samarth@workforce.com', role: 'Worker', subRole: 'Trainee', passwordHash: defaultPasswordHash },
      { employeeId: 'MGR001', firstName: 'Kavita', lastName: 'Reddy', mobile: '9876543225', email: 'kavita@workforce.com', role: 'Supervisor', subRole: null, passwordHash: defaultPasswordHash },
      { employeeId: 'SUPER001', firstName: 'Vikram', lastName: 'Singh', mobile: '9876543224', email: 'vikram@workforce.com', role: 'Supervisor', subRole: null, passwordHash: defaultPasswordHash },
    ];

    const users = [];

    // Create base users
    for (const bu of baseUsers) {
      const fNamePart = bu.firstName.trim().split(' ')[0] || '';
      const namePart = fNamePart.substring(0, 3).toUpperCase();
      const mobilePart = bu.mobile.slice(-3);
      const formulaPassword = `${namePart}${mobilePart}`;
      const passwordHash = await bcrypt.hash(formulaPassword, 10);

      const dbUser = await prisma.user.create({
        data: {
          employeeId: bu.employeeId,
          firstName: bu.firstName,
          lastName: bu.lastName,
          mobile: bu.mobile,
          email: bu.email,
          roleId: roles[bu.role].id,
          subRole: bu.subRole,
          passwordHash: passwordHash,
          status: 'ACTIVE',
          isActive: true,
          isDeleted: false
        }
      });
      users.push(dbUser);
    }

    // Generate remainder of 100 users (92 extra users)
    const mobileSet = new Set(baseUsers.map(u => u.mobile));
    const empIdSet = new Set(baseUsers.map(u => u.employeeId));

    let createdExtra = 0;
    while (createdExtra < 92) {
      const fName = firstNames[createdExtra % firstNames.length];
      const lName = lastNames[Math.floor(Math.random() * lastNames.length)];
      
      const numPart = String(2004 + createdExtra).padStart(4, '0');
      const employeeId = `EMP-${numPart}`;
      const mobile = `987${Math.floor(1000000 + Math.random() * 9000000)}`;

      if (mobileSet.has(mobile) || empIdSet.has(employeeId)) {
        continue; // Prevent duplicates
      }
      mobileSet.add(mobile);
      empIdSet.add(employeeId);

      const subRoleVal = Math.random() > 0.35 ? 'Skilled' : 'Trainee';

      const fNamePart = fName.trim().split(' ')[0] || '';
      const namePart = fNamePart.substring(0, 3).toUpperCase();
      const mobilePart = mobile.slice(-3);
      const formulaPassword = `${namePart}${mobilePart}`;
      const passwordHash = await bcrypt.hash(formulaPassword, 10);

      const dbUser = await prisma.user.create({
        data: {
          employeeId,
          firstName: fName,
          lastName: lName,
          mobile,
          email: `${fName.toLowerCase()}.${lName.toLowerCase()}@workforce.com`,
          roleId: roles['Worker'].id,
          subRole: subRoleVal,
          passwordHash: passwordHash,
          status: Math.random() > 0.15 ? 'ACTIVE' : 'ON_LEAVE',
          isActive: true,
          isDeleted: false
        }
      });
      users.push(dbUser);
      createdExtra++;
    }
    console.log(`Successfully generated ${users.length} total users in DB.`);

    // 5. Seed Sales Orders spanning the last 1 year
    console.log('Generating Sales Orders (History of last 1 year)...');
    const customers = [
      'Siemens Energy', 'General Electric Grid', 'ABB Power Grids', 'Schneider Electric', 'Tata Power Ltd',
      'Reliance Infrastructure', 'NTPC Limited', 'Toshiba Transmission', 'Crompton Greaves Co.', 'L&T Power'
    ];

    const transformerTypes = [
      '50MVA Power Transformer Step-Up',
      '1000kVA Distribution Transformer Batch',
      '25MVA Dry-Type Auxiliary Transformer',
      '15MVA Electric Arc Furnace Transformer',
      'Auto-Transformer 100MVA System',
      'Unit Auxiliary Transformer 20MVA 11/6.6kV'
    ];

    const salesOrders = [];
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    for (let i = 1; i <= 20; i++) {
      const soNumber = `SO-${1000 + i}`;
      const customerName = customers[i % customers.length];
      const projectName = transformerTypes[i % transformerTypes.length];
      const soDescription = `Manufacturing and full HV testing of ${projectName} for client ${customerName}`;

      // Date logic distributed over the last year
      const startDate = new Date(oneYearAgo.getTime());
      startDate.setDate(startDate.getDate() + (i * 16)); // offset start dates

      const endDate = new Date(startDate.getTime());
      endDate.setDate(endDate.getDate() + 30 + Math.floor(Math.random() * 45)); // 30-75 days execution time

      let status = 'OPEN';
      const today = new Date();
      if (endDate < today) {
        status = 'COMPLETED';
      } else if (startDate < today && endDate > today) {
        status = Math.random() > 0.2 ? 'IN_PROGRESS' : 'ON_HOLD';
      }

      const so = await prisma.salesOrder.create({
        data: {
          soNumber,
          customerName,
          projectName,
          soDescription,
          startDate,
          endDate,
          status,
          isActive: status !== 'COMPLETED',
          isDeleted: false
        }
      });
      salesOrders.push(so);

      // Connect Sales Order to departments and activities
      for (const dept of dbDepts) {
        const soDept = await prisma.sODepartment.create({
          data: {
            soId: so.id,
            departmentId: dept.id
          }
        });

        // Add all activities under this department to this Sales Order
        const deptActs = deptActivitiesMap[dept.id];
        for (const act of deptActs) {
          await prisma.sODepartmentActivity.create({
            data: {
              soDepartmentId: soDept.id,
              activityId: act.id
            }
          });
        }
      }
    }
    console.log(`Seeded ${salesOrders.length} Sales Orders and connected them to all departments.`);

    // 6. Generate 1,500 Activity Logs spanning the last 1 year
    console.log('Generating 1,500 historical Activity Logs for analysis...');
    const activityLogsToCreate = 1500;
    const workerUsers = users.filter(u => u.employeeId !== 'ADMIN001' && u.employeeId !== 'EMP-1042'); // Workers only

    // Pre-calculate date range blocks
    const totalDays = 365;
    const logsPerDay = Math.ceil(activityLogsToCreate / totalDays);

    let logsCount = 0;
    const today = new Date();

    for (let dayOffset = 0; dayOffset < totalDays; dayOffset++) {
      const logDate = new Date(oneYearAgo.getTime());
      logDate.setDate(logDate.getDate() + dayOffset);

      if (logDate > today) break;

      // Select 4-5 logs to generate on this day
      for (let l = 0; l < logsPerDay; l++) {
        if (logsCount >= activityLogsToCreate) break;

        const worker = workerUsers[Math.floor(Math.random() * workerUsers.length)];
        
        // Find sales orders that were active on this specific date
        const activeSOs = salesOrders.filter(so => logDate >= so.startDate && logDate <= so.endDate);
        const so = activeSOs.length > 0 ? activeSOs[Math.floor(Math.random() * activeSOs.length)] : salesOrders[Math.floor(Math.random() * salesOrders.length)];

        // Select random department and activity
        const dept = dbDepts[Math.floor(Math.random() * dbDepts.length)];
        const deptActs = deptActivitiesMap[dept.id];
        const activity = deptActs[Math.floor(Math.random() * deptActs.length)];

        const standardMin = activity.standardManMinutes;
        // Generate actual duration: +/- 25% of standard time
        const durationFactor = 0.75 + Math.random() * 0.50; // 75% to 125%
        const durationMinutes = Math.max(15, Math.round(standardMin * durationFactor));

        // Randomize status
        let logStatus = 'COMPLETED';
        if (so.status === 'IN_PROGRESS' && dayOffset > 350 && Math.random() > 0.8) {
          logStatus = 'IN_PROGRESS';
        }

        const isRework = Math.random() > 0.93; // 7% rework logs
        const hasRemarks = isRework || Math.random() > 0.7;

        let remarks = null;
        if (isRework) {
          remarks = `Rework: Correcting ${activity.activityName.toLowerCase()} issue found in testing.`;
        } else if (hasRemarks) {
          remarks = `Completed task ${activity.activityName} on project ${so.soNumber} successfully.`;
        }

        // Waiting time logs simulated
        const hasWaitingTime = !isRework && Math.random() > 0.92;
        if (hasWaitingTime) {
          remarks = `Waiting time: Delayed 45 mins waiting for crane/materials.`;
        }

        // Try-catch block to avoid duplicate key exceptions (due to unique constraints on user+so+dept+act+date)
        try {
          const log = await prisma.activityLog.create({
            data: {
              userId: worker.id,
              soId: so.id,
              departmentId: dept.id,
              activityId: activity.id,
              activityDate: logDate,
              status: logStatus,
              remarks,
              isRework,
              createdAt: logDate,
              updatedAt: logDate
            }
          });

          // Create slot timings
          const startTime = new Date(logDate.getTime());
          startTime.setHours(9 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 60)); // start between 9 AM and 1 PM
          
          const endTime = new Date(startTime.getTime());
          endTime.setMinutes(endTime.getMinutes() + durationMinutes);

          await prisma.activitySlot.create({
            data: {
              activityLogId: log.id,
              startTime,
              endTime,
              durationMinutes
            }
          });

          logsCount++;
        } catch (e) {
          // Unique constraint hit, skip silently
        }
      }
    }

    console.log(`Seeded ${logsCount} historical Activity Logs successfully!`);
    console.log('🎉 Database Seeding completed successfully!');
  } catch (error) {
    console.error('Error during seeding:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
