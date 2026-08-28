-- AlterTable
ALTER TABLE "AppSettings" ADD COLUMN     "guestModeChangedAt" TIMESTAMP(3),
ADD COLUMN     "guestModeChangedBy" TEXT;
