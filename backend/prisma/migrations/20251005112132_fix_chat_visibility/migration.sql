-- AlterTable
ALTER TABLE "User" ADD COLUMN     "unfreezeAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "_HiddenChatsForUsers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_HiddenChatsForUsers_AB_unique" ON "_HiddenChatsForUsers"("A", "B");

-- CreateIndex
CREATE INDEX "_HiddenChatsForUsers_B_index" ON "_HiddenChatsForUsers"("B");

-- AddForeignKey
ALTER TABLE "_HiddenChatsForUsers" ADD CONSTRAINT "_HiddenChatsForUsers_A_fkey" FOREIGN KEY ("A") REFERENCES "Chatroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_HiddenChatsForUsers" ADD CONSTRAINT "_HiddenChatsForUsers_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
