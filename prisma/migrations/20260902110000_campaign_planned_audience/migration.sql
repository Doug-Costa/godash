CREATE TABLE "CampaignAudienceMember" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "sourceType" TEXT NOT NULL DEFAULT 'MANUAL',
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enrolledAt" TIMESTAMP(3),
    "removedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CampaignAudienceMember_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CampaignAudienceMember_campaignId_customerId_key"
ON "CampaignAudienceMember"("campaignId", "customerId");
CREATE INDEX "CampaignAudienceMember_campaignId_status_idx"
ON "CampaignAudienceMember"("campaignId", "status");
CREATE INDEX "CampaignAudienceMember_customerId_idx"
ON "CampaignAudienceMember"("customerId");

ALTER TABLE "CampaignAudienceMember"
ADD CONSTRAINT "CampaignAudienceMember_campaignId_fkey"
FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CampaignAudienceMember"
ADD CONSTRAINT "CampaignAudienceMember_customerId_fkey"
FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
