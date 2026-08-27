-- CreateTable
CREATE TABLE "LastLinkCache" (
    "email" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LastLinkCache_pkey" PRIMARY KEY ("email")
);
