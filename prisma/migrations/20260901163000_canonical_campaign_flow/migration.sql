-- Canonical campaign/flow architecture. Legacy Journey data remains readable,
-- while every new campaign uses Campaign + versioned Flow + Enrollment.

ALTER TABLE "Campaign" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
ALTER TABLE "Flow" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'MARKETING';

CREATE TABLE "FlowVersion" (
  "id" TEXT NOT NULL,
  "flowId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "graph" JSONB DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "publishedAt" TIMESTAMP(3),
  CONSTRAINT "FlowVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FlowVersionStep" (
  "id" TEXT NOT NULL,
  "flowVersionId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  "channel" TEXT,
  "templateId" TEXT,
  "delayMinutes" INTEGER,
  "targetPipelineId" TEXT,
  "targetStage" TEXT,
  "nextFlowId" TEXT,
  "config" JSONB DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FlowVersionStep_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Campaign"
  ADD COLUMN "flowVersionId" TEXT,
  ADD COLUMN "pipelineId" TEXT,
  ADD COLUMN "initialStage" TEXT NOT NULL DEFAULT 'novo_cadastro',
  ADD COLUMN "startsAt" TIMESTAMP(3),
  ADD COLUMN "endsAt" TIMESTAMP(3),
  ADD COLUMN "limitPerDay" INTEGER,
  ADD COLUMN "excludeNurturing" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "FlowExecution" ADD COLUMN "flowVersionId" TEXT;
ALTER TABLE "Product" ADD COLUMN "postSaleCampaignId" TEXT, ADD COLUMN "nurturingCampaignId" TEXT;

CREATE TABLE "CampaignOperator" (
  "id" TEXT NOT NULL,
  "campaignId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CampaignOperator_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CampaignEnrollment" (
  "id" TEXT NOT NULL,
  "campaignId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "opportunityId" TEXT,
  "assigneeId" TEXT,
  "flowExecutionId" TEXT,
  "sourceType" TEXT NOT NULL DEFAULT 'SEGMENT',
  "sourceFormId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "isTest" BOOLEAN NOT NULL DEFAULT false,
  "currentStep" INTEGER,
  "enteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "stopReason" TEXT,
  "attribution" JSONB DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CampaignEnrollment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FlowVersion_flowId_version_key" ON "FlowVersion"("flowId", "version");
CREATE INDEX "FlowVersion_status_idx" ON "FlowVersion"("status");
CREATE UNIQUE INDEX "FlowVersionStep_flowVersionId_order_key" ON "FlowVersionStep"("flowVersionId", "order");
CREATE INDEX "FlowVersionStep_nextFlowId_idx" ON "FlowVersionStep"("nextFlowId");
CREATE INDEX "Campaign_status_idx" ON "Campaign"("status");
CREATE INDEX "Campaign_pipelineId_idx" ON "Campaign"("pipelineId");
CREATE INDEX "Campaign_flowId_idx" ON "Campaign"("flowId");
CREATE UNIQUE INDEX "CampaignOperator_campaignId_userId_key" ON "CampaignOperator"("campaignId", "userId");
CREATE INDEX "CampaignOperator_userId_idx" ON "CampaignOperator"("userId");
CREATE UNIQUE INDEX "CampaignEnrollment_flowExecutionId_key" ON "CampaignEnrollment"("flowExecutionId");
CREATE UNIQUE INDEX "CampaignEnrollment_campaignId_customerId_isTest_key" ON "CampaignEnrollment"("campaignId", "customerId", "isTest");
CREATE INDEX "CampaignEnrollment_campaignId_status_idx" ON "CampaignEnrollment"("campaignId", "status");
CREATE INDEX "CampaignEnrollment_customerId_idx" ON "CampaignEnrollment"("customerId");
CREATE INDEX "CampaignEnrollment_assigneeId_idx" ON "CampaignEnrollment"("assigneeId");
CREATE INDEX "Product_postSaleCampaignId_idx" ON "Product"("postSaleCampaignId");
CREATE INDEX "Product_nurturingCampaignId_idx" ON "Product"("nurturingCampaignId");

ALTER TABLE "FlowVersion" ADD CONSTRAINT "FlowVersion_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "Flow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FlowVersionStep" ADD CONSTRAINT "FlowVersionStep_flowVersionId_fkey" FOREIGN KEY ("flowVersionId") REFERENCES "FlowVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_flowVersionId_fkey" FOREIGN KEY ("flowVersionId") REFERENCES "FlowVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "Pipeline"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FlowExecution" ADD CONSTRAINT "FlowExecution_flowVersionId_fkey" FOREIGN KEY ("flowVersionId") REFERENCES "FlowVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CampaignOperator" ADD CONSTRAINT "CampaignOperator_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CampaignOperator" ADD CONSTRAINT "CampaignOperator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CampaignEnrollment" ADD CONSTRAINT "CampaignEnrollment_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CampaignEnrollment" ADD CONSTRAINT "CampaignEnrollment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CampaignEnrollment" ADD CONSTRAINT "CampaignEnrollment_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CampaignEnrollment" ADD CONSTRAINT "CampaignEnrollment_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CampaignEnrollment" ADD CONSTRAINT "CampaignEnrollment_flowExecutionId_fkey" FOREIGN KEY ("flowExecutionId") REFERENCES "FlowExecution"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_postSaleCampaignId_fkey" FOREIGN KEY ("postSaleCampaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_nurturingCampaignId_fkey" FOREIGN KEY ("nurturingCampaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
