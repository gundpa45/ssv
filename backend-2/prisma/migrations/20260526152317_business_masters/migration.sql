-- CreateEnum
CREATE TYPE "SOStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED');

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "activityCode" TEXT NOT NULL,
    "activityName" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "standardTimeMinutes" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleActivity" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoleActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SO" (
    "id" TEXT NOT NULL,
    "soNumber" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "description" TEXT,
    "status" "SOStatus" NOT NULL DEFAULT 'OPEN',
    "startDate" TIMESTAMP(3) NOT NULL,
    "targetDate" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SO_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Activity_activityCode_key" ON "Activity"("activityCode");

-- CreateIndex
CREATE UNIQUE INDEX "RoleActivity_roleId_activityId_key" ON "RoleActivity"("roleId", "activityId");

-- CreateIndex
CREATE UNIQUE INDEX "SO_soNumber_key" ON "SO"("soNumber");

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleActivity" ADD CONSTRAINT "RoleActivity_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleActivity" ADD CONSTRAINT "RoleActivity_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
