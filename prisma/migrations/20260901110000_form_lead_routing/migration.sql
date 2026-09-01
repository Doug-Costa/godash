-- Form submissions are always opportunities (DESEJO). These columns configure
-- optional assignment and journey enrollment without creating purchases.
ALTER TABLE "Form"
ADD COLUMN "journeyId" TEXT,
ADD COLUMN "assignmentMode" TEXT NOT NULL DEFAULT 'POOL',
ADD COLUMN "fixedAssigneeId" TEXT;

CREATE INDEX "Form_journeyId_idx" ON "Form"("journeyId");
CREATE INDEX "Form_fixedAssigneeId_idx" ON "Form"("fixedAssigneeId");

ALTER TABLE "Form"
ADD CONSTRAINT "Form_journeyId_fkey"
FOREIGN KEY ("journeyId") REFERENCES "Journey"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Form"
ADD CONSTRAINT "Form_fixedAssigneeId_fkey"
FOREIGN KEY ("fixedAssigneeId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
