-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('Draft', 'Published');

-- CreateEnum
CREATE TYPE "GameOrientation" AS ENUM ('Landscape', 'Portrait', 'Both');

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "instructions" TEXT,
    "packageUrl" TEXT NOT NULL,
    "entryFilePath" TEXT NOT NULL DEFAULT 'index.html',
    "iconUrl" TEXT NOT NULL,
    "coverImageUrl" TEXT NOT NULL,
    "width" INTEGER NOT NULL DEFAULT 1280,
    "height" INTEGER NOT NULL DEFAULT 720,
    "orientation" "GameOrientation" NOT NULL DEFAULT 'Landscape',
    "developerName" TEXT,
    "version" TEXT,
    "status" "GameStatus" NOT NULL DEFAULT 'Draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameScreenshot" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameScreenshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameTag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_GameToGameCategory" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_GameToGameTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Game_slug_key" ON "Game"("slug");

-- CreateIndex
CREATE INDEX "Game_slug_idx" ON "Game"("slug");

-- CreateIndex
CREATE INDEX "Game_status_idx" ON "Game"("status");

-- CreateIndex
CREATE INDEX "Game_createdAt_idx" ON "Game"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "GameCategory_name_key" ON "GameCategory"("name");

-- CreateIndex
CREATE INDEX "GameCategory_name_idx" ON "GameCategory"("name");

-- CreateIndex
CREATE INDEX "GameScreenshot_gameId_idx" ON "GameScreenshot"("gameId");

-- CreateIndex
CREATE INDEX "GameScreenshot_order_idx" ON "GameScreenshot"("order");

-- CreateIndex
CREATE UNIQUE INDEX "GameTag_name_key" ON "GameTag"("name");

-- CreateIndex
CREATE INDEX "_GameToGameCategory_B_index" ON "_GameToGameCategory"("B");

-- CreateIndex
CREATE INDEX "_GameToGameTag_B_index" ON "_GameToGameTag"("B");

-- AddForeignKey
ALTER TABLE "GameScreenshot" ADD CONSTRAINT "GameScreenshot_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GameToGameCategory" ADD CONSTRAINT "_GameToGameCategory_A_fkey" FOREIGN KEY ("A") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GameToGameCategory" ADD CONSTRAINT "_GameToGameCategory_B_fkey" FOREIGN KEY ("B") REFERENCES "GameCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GameToGameTag" ADD CONSTRAINT "_GameToGameTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GameToGameTag" ADD CONSTRAINT "_GameToGameTag_B_fkey" FOREIGN KEY ("B") REFERENCES "GameTag"("id") ON DELETE CASCADE ON UPDATE CASCADE; 