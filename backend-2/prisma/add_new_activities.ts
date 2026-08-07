import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const data = [
  {
    departmentName: 'INSULATION',
    departmentCode: 'INS',
    activities: [
      { name: 'LV CYLENDER CUTTING', minutes: 120 },
      { name: 'HV CYLENDER CUTTING', minutes: 90 },
      { name: 'EARTHING SHIELD CUTTING', minutes: 30 },
      { name: 'END COLLER CUTTING', minutes: 200 },
      { name: 'COOLING CANAL CUTTING', minutes: 200 },
      { name: 'LV COOLING CANAL PASTING', minutes: 200 },
      { name: 'HV COOLING CANAL PASTING', minutes: 200 },
      { name: 'HILO & HV OUTER COOLING CANAL PASTING', minutes: 200 },
      { name: 'LV WINDING BUSBAR BENDING & PUNCHING', minutes: 200 },
      { name: 'NOMEX PAPER CUTTING FOR LV BUSBAR', minutes: 200 },
      { name: 'MATERIAL ARRANGE ON STAND & LOAD ON OVEN', minutes: 200 },
      { name: 'MATERIAL REMOVE FROM OVEN & OIL DIPPING', minutes: 200 },
      { name: 'REMOVE FROM OIL & ARRANGE IN TRAY', minutes: 200 },
      { name: 'BALANCE MATERIAL RETURN TO STORE', minutes: 200 },
    ],
  },
  {
    departmentName: 'LV FOIL WINDING',
    departmentCode: 'LVF',
    activities: [
      { name: 'MATERIAL COLLECT FROM STORE', minutes: 200 },
      { name: 'CHECKED & LOADED ON MACHINE', minutes: 200 },
      { name: 'FORMER ASSEMBLY', minutes: 200 },
      { name: 'FORMER LOADING & SETTING', minutes: 200 },
      { name: 'CYLENDER ARRANGE & PASTING', minutes: 200 },
      { name: 'START BUSBAR BRAZING & INSULATING', minutes: 200 },
      { name: 'WINDING START & 1/2 WINDING COMPLITED', minutes: 200 },
      { name: 'BAL 1/2 WINDING TO END BUSBAR BRAZING', minutes: 200 },
      { name: 'COIL FINISH & OK FROM PRD/QA', minutes: 200 },
      { name: 'HI-LO COMPLETION', minutes: 200 },
      { name: 'PRD/QC CHECK & UNLOADING & STORE', minutes: 200 },
      { name: 'BALANCE MATERIAL RETURN TO STORE', minutes: 200 },
    ],
  },
  {
    departmentName: 'HV LAYER WINDING',
    departmentCode: 'HVL',
    activities: [
      { name: 'MATERIAL COLLECT FROM STORE', minutes: 200 },
      { name: 'MATERIAL CHECKED & LOADED ON MACHINE', minutes: 200 },
      { name: 'FORMER ASSEMBLY', minutes: 200 },
      { name: 'COIL LOADING & SETTING', minutes: 200 },
      { name: 'WINDING START TO 4 LAYER', minutes: 200 },
      { name: '4 LAYER TO 8 LAYER WINDING', minutes: 200 },
      { name: '8 LAYER TO 12 LAYER WINDING', minutes: 200 },
      { name: '12 LAYER TO 16 LAYER WINDING', minutes: 200 },
      { name: '16 LAYER TO 20 LAYER WINDING', minutes: 200 },
      { name: '20 LAYER TO 24 LAYER WINDING', minutes: 200 },
      { name: '24 LAYER TO 28 LAYER WINDING', minutes: 200 },
      { name: '1-3 TAPS BRAZING', minutes: 200 },
      { name: '3-6 TAPS BRAZING', minutes: 200 },
      { name: 'TRANSPOSITON IN LAYER WINDING', minutes: 200 },
      { name: 'HV CYLENDER ARRANGE & PASTING', minutes: 200 },
      { name: 'WINDING PRD/QC CHECK', minutes: 200 },
      { name: 'WINDING UNLOADING & STORE', minutes: 200 },
      { name: 'BALANCE MATERIAL RETURN TO STORE', minutes: 200 },
    ],
  },
];

async function main() {
  console.log('Starting non-destructive database addition...');

  // Get all sales orders to link the new departments/activities to
  const salesOrders = await prisma.salesOrder.findMany();
  console.log(`Found ${salesOrders.length} existing Sales Orders.`);

  for (const item of data) {
    // 1. Create or get Department
    let dept = await prisma.department.findFirst({
      where: { name: item.departmentName },
    });

    if (!dept) {
      dept = await prisma.department.create({
        data: {
          name: item.departmentName,
          code: item.departmentCode,
          description: `${item.departmentName} Department`,
        },
      });
      console.log(`Created Department: ${dept.name}`);
    } else {
      console.log(`Department already exists: ${dept.name}`);
    }

    // Connect this department to all existing Sales Orders
    for (const so of salesOrders) {
      let soDept = await prisma.sODepartment.findUnique({
        where: {
          soId_departmentId: {
            soId: so.id,
            departmentId: dept.id,
          },
        },
      });

      if (!soDept) {
        soDept = await prisma.sODepartment.create({
          data: {
            soId: so.id,
            departmentId: dept.id,
          },
        });
        console.log(`Linked Department ${dept.name} to Sales Order ${so.soNumber}`);
      }

      // 2. Create or get Activities for this department
      for (const act of item.activities) {
        let activity = await prisma.activity.findFirst({
          where: {
            activityName: act.name,
            departmentId: dept.id,
          },
        });

        if (!activity) {
          activity = await prisma.activity.create({
            data: {
              activityName: act.name,
              standardManMinutes: act.minutes,
              departmentId: dept.id,
            },
          });
          console.log(`Created Activity: ${activity.activityName} in ${dept.name}`);
        }

        // Link activity to this SO Department pair
        let soAct = await prisma.sODepartmentActivity.findUnique({
          where: {
            soDepartmentId_activityId: {
              soDepartmentId: soDept.id,
              activityId: activity.id,
            },
          },
        });

        if (!soAct) {
          await prisma.sODepartmentActivity.create({
            data: {
              soDepartmentId: soDept.id,
              activityId: activity.id,
            },
          });
          console.log(`Linked Activity ${activity.activityName} to SO-Dept link`);
        }
      }
    }
  }

  console.log('Database addition completed successfully with NO data deletions!');
}

main()
  .catch((e) => {
    console.error('Error executing script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
