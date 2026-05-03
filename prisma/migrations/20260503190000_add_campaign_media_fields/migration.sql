ALTER TABLE "WhatsAppCampaign"
ADD COLUMN "messageType" "MessageType" NOT NULL DEFAULT 'TEXT',
ADD COLUMN "mediaUrl" TEXT,
ADD COLUMN "mimeType" TEXT,
ADD COLUMN "mediaCaption" TEXT,
ADD COLUMN "mediaFileName" TEXT;
