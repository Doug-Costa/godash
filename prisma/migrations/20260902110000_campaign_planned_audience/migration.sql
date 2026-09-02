CREATE TABLE `CampaignAudienceMember` (
    `id` VARCHAR(191) NOT NULL,
    `campaignId` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PLANNED',
    `sourceType` VARCHAR(191) NOT NULL DEFAULT 'MANUAL',
    `addedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `enrolledAt` DATETIME(3) NULL,
    `removedAt` DATETIME(3) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CampaignAudienceMember_campaignId_customerId_key`(`campaignId`, `customerId`),
    INDEX `CampaignAudienceMember_campaignId_status_idx`(`campaignId`, `status`),
    INDEX `CampaignAudienceMember_customerId_idx`(`customerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `CampaignAudienceMember`
    ADD CONSTRAINT `CampaignAudienceMember_campaignId_fkey`
    FOREIGN KEY (`campaignId`) REFERENCES `Campaign`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `CampaignAudienceMember`
    ADD CONSTRAINT `CampaignAudienceMember_customerId_fkey`
    FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
