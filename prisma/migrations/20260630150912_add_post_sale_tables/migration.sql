-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" DATETIME,
    "image" TEXT,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'AGENT',
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "LeadState" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "externalPersonId" INTEGER NOT NULL,
    "stage" TEXT NOT NULL,
    "assigneeId" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LeadState_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LeadInteraction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadStateId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LeadInteraction_leadStateId_fkey" FOREIGN KEY ("leadStateId") REFERENCES "LeadState" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LeadInteraction_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PostSaleSequence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "name" TEXT NOT NULL,
    "triggerDays" INTEGER NOT NULL,
    "templateMessage" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "targetSegment" TEXT NOT NULL DEFAULT 'paid'
);

-- CreateTable
CREATE TABLE "LeadPostSaleTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "externalPersonId" INTEGER NOT NULL,
    "sequenceId" TEXT NOT NULL,
    "assignedToId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "scheduledFor" DATETIME NOT NULL,
    "completedAt" DATETIME,
    "completionNote" TEXT,
    "snapshotPlanId" INTEGER,
    "snapshotPlanName" TEXT,
    CONSTRAINT "LeadPostSaleTask_sequenceId_fkey" FOREIGN KEY ("sequenceId") REFERENCES "PostSaleSequence" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LeadPostSaleTask_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "LeadState_externalPersonId_key" ON "LeadState"("externalPersonId");

-- CreateIndex
CREATE INDEX "LeadPostSaleTask_externalPersonId_idx" ON "LeadPostSaleTask"("externalPersonId");

-- CreateIndex
CREATE INDEX "LeadPostSaleTask_status_scheduledFor_idx" ON "LeadPostSaleTask"("status", "scheduledFor");

-- CreateIndex
CREATE INDEX "LeadPostSaleTask_assignedToId_status_idx" ON "LeadPostSaleTask"("assignedToId", "status");
