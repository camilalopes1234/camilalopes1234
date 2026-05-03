-- CreateEnum
CREATE TYPE "WhatsAppTemplateCategory" AS ENUM ('MARKETING', 'UTILITY', 'AUTHENTICATION', 'SERVICE');

-- CreateEnum
CREATE TYPE "WhatsAppCampaignStatus" AS ENUM ('DRAFT', 'READY', 'PROCESSING', 'COMPLETED', 'PAUSED', 'FAILED');

-- CreateEnum
CREATE TYPE "WhatsAppCampaignSendMode" AS ENUM ('TEXT', 'TEMPLATE');

-- CreateEnum
CREATE TYPE "WhatsAppCampaignRecipientStatus" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'SKIPPED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ActivityEntity" ADD VALUE 'WHATSAPP_TEMPLATE';
ALTER TYPE "ActivityEntity" ADD VALUE 'WHATSAPP_CAMPAIGN';

-- CreateTable
CREATE TABLE "WhatsAppTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "category" "WhatsAppTemplateCategory" NOT NULL DEFAULT 'MARKETING',
    "languageCode" TEXT NOT NULL DEFAULT 'pt_BR',
    "bodyText" TEXT NOT NULL,
    "variableKeys" JSONB,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "WhatsAppTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppCampaign" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sendMode" "WhatsAppCampaignSendMode" NOT NULL DEFAULT 'TEXT',
    "status" "WhatsAppCampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "messageBody" TEXT NOT NULL,
    "audienceSearch" TEXT,
    "filterStage" "LeadStage",
    "filterSourcePrimary" "LeadSourcePrimary",
    "filterTemperature" "LeadTemperature",
    "filterOwnerId" TEXT,
    "filterCity" TEXT,
    "requiresOptIn" BOOLEAN NOT NULL DEFAULT false,
    "recipientsCount" INTEGER NOT NULL DEFAULT 0,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "deliveredCount" INTEGER NOT NULL DEFAULT 0,
    "readCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "skippedCount" INTEGER NOT NULL DEFAULT 0,
    "scheduledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "lastDispatchAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "templateId" TEXT,

    CONSTRAINT "WhatsAppCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppCampaignRecipient" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "conversationId" TEXT,
    "phone" TEXT NOT NULL,
    "personalizedBody" TEXT,
    "status" "WhatsAppCampaignRecipientStatus" NOT NULL DEFAULT 'QUEUED',
    "providerMessageId" TEXT,
    "failureReason" TEXT,
    "queuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastTriedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppCampaignRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppTemplate_name_key" ON "WhatsAppTemplate"("name");

-- CreateIndex
CREATE INDEX "WhatsAppTemplate_createdById_idx" ON "WhatsAppTemplate"("createdById");

-- CreateIndex
CREATE INDEX "WhatsAppCampaign_createdById_status_idx" ON "WhatsAppCampaign"("createdById", "status");

-- CreateIndex
CREATE INDEX "WhatsAppCampaign_filterOwnerId_idx" ON "WhatsAppCampaign"("filterOwnerId");

-- CreateIndex
CREATE INDEX "WhatsAppCampaign_templateId_idx" ON "WhatsAppCampaign"("templateId");

-- CreateIndex
CREATE INDEX "WhatsAppCampaignRecipient_campaignId_status_idx" ON "WhatsAppCampaignRecipient"("campaignId", "status");

-- CreateIndex
CREATE INDEX "WhatsAppCampaignRecipient_leadId_idx" ON "WhatsAppCampaignRecipient"("leadId");

-- CreateIndex
CREATE INDEX "WhatsAppCampaignRecipient_providerMessageId_idx" ON "WhatsAppCampaignRecipient"("providerMessageId");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppCampaignRecipient_campaignId_leadId_key" ON "WhatsAppCampaignRecipient"("campaignId", "leadId");

-- AddForeignKey
ALTER TABLE "WhatsAppTemplate" ADD CONSTRAINT "WhatsAppTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppCampaign" ADD CONSTRAINT "WhatsAppCampaign_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppCampaign" ADD CONSTRAINT "WhatsAppCampaign_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "WhatsAppTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppCampaignRecipient" ADD CONSTRAINT "WhatsAppCampaignRecipient_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "WhatsAppCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppCampaignRecipient" ADD CONSTRAINT "WhatsAppCampaignRecipient_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppCampaignRecipient" ADD CONSTRAINT "WhatsAppCampaignRecipient_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
