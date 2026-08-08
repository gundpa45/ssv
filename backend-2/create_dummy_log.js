const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { role: { name: 'Worker' } }
  });
  const fallbackUser = await prisma.user.findFirst();
  const finalUser = user || fallbackUser;

  const so = await prisma.salesOrder.findFirst();
  const dept = await prisma.department.findFirst();
  const activity = await prisma.activity.findFirst();

  if (!finalUser || !so || !dept || !activity) {
    console.error("Missing data to create log. Please make sure you have at least one user, SO, department, and activity.");
    return;
  }

  const log = await prisma.activityLog.create({
    data: {
      userId: finalUser.id,
      soId: so.id,
      departmentId: dept.id,
      activityId: activity.id,
      activityDate: new Date(),
      status: 'PENDING',
      remarks: 'Just finished this task. Needs approval.',
      slots: {
        create: {
          startTime: new Date(new Date().setHours(9, 0, 0, 0)),
          endTime: new Date(new Date().setHours(11, 0, 0, 0)),
          durationMinutes: 120
        }
      }
    }
  });
  console.log("Successfully created Pending Activity Log with ID:", log.id);
}
main().catch(console.error).finally(() => prisma.$disconnect());
