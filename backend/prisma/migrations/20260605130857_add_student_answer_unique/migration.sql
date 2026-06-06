/*
  Warnings:

  - A unique constraint covering the columns `[sessionId,questionId]` on the table `StudentAnswer` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "StudentAnswer_sessionId_questionId_key" ON "StudentAnswer"("sessionId", "questionId");
