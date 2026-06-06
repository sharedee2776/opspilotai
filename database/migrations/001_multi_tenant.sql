-- OpsPilot Phase C: multi-tenant columns and integrations table
-- Run against Railway Postgres when NODE_ENV=production (synchronize is off)

CREATE TYPE integrations_type_enum AS ENUM ('slack', 'datadog', 'cloudwatch');

CREATE TABLE IF NOT EXISTS integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organizationId" uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type integrations_type_enum NOT NULL,
  "externalId" varchar NOT NULL,
  credentials jsonb NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (type, "externalId")
);

CREATE INDEX IF NOT EXISTS idx_integrations_org_type ON integrations ("organizationId", type);

ALTER TABLE alerts ADD COLUMN IF NOT EXISTS "organizationId" uuid REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS "integrationId" uuid;

ALTER TABLE incidents ADD COLUMN IF NOT EXISTS "organizationId" uuid REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE actions ADD COLUMN IF NOT EXISTS "organizationId" uuid REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_alerts_org_dedup_created ON alerts ("organizationId", "dedupHash", "createdAt");
CREATE INDEX IF NOT EXISTS idx_alerts_org_service_status ON alerts ("organizationId", service, status);
CREATE INDEX IF NOT EXISTS idx_incidents_org_service_status ON incidents ("organizationId", service, status);

-- Optional backfill: assign existing rows to your first organization
-- UPDATE alerts SET "organizationId" = '<your-org-uuid>' WHERE "organizationId" IS NULL;
-- UPDATE incidents SET "organizationId" = '<your-org-uuid>' WHERE "organizationId" IS NULL;
-- UPDATE actions SET "organizationId" = '<your-org-uuid>' WHERE "organizationId" IS NULL;

-- After backfill, enforce NOT NULL:
-- ALTER TABLE alerts ALTER COLUMN "organizationId" SET NOT NULL;
-- ALTER TABLE incidents ALTER COLUMN "organizationId" SET NOT NULL;
-- ALTER TABLE actions ALTER COLUMN "organizationId" SET NOT NULL;
