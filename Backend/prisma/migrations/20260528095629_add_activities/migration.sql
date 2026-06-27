/*
  Warnings:

  - You are about to drop the column `activityCode` on the `Activity` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Activity_activityCode_key";

-- AlterTable
ALTER TABLE "Activity" DROP COLUMN "activityCode",
ADD COLUMN     "restrictedRoleId" TEXT;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_restrictedRoleId_fkey" FOREIGN KEY ("restrictedRoleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;
