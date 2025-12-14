-- CreateTable
CREATE TABLE "UserCode" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "fullname" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UserCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserCode_phone_key" ON "UserCode"("phone");

-- CreateIndex
CREATE INDEX "UserCode_phone_idx" ON "UserCode"("phone");

-- CreateIndex
CREATE INDEX "UserCode_createdAt_idx" ON "UserCode"("createdAt");

-- CreateIndex
CREATE INDEX "UserCode_updatedAt_idx" ON "UserCode"("updatedAt");
