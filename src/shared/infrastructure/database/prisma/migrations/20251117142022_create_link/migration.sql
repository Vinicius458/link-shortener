-- CreateTable
CREATE TABLE "links" (
    "id" UUID NOT NULL,
    "originalUrl" VARCHAR(2048) NOT NULL,
    "shortCode" VARCHAR(6) NOT NULL,
    "ownerId" UUID,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "links_shortCode_key" ON "links"("shortCode");

-- CreateIndex
CREATE INDEX "links_ownerId_idx" ON "links"("ownerId");

-- AddForeignKey
ALTER TABLE "links" ADD CONSTRAINT "links_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
