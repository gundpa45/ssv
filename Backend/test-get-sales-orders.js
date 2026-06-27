const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const salesOrders = await prisma.salesOrder.findMany({
      where: {
        isDeleted: false,
      },
      include: {
        soDepartments: {
          include: {
            department: true,
            soDepartmentActivities: {
              include: {
                activity: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    console.log('Successfully fetched sales orders:', JSON.stringify(salesOrders, null, 2));
  } catch (error) {
    console.error('Error fetching sales orders:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
