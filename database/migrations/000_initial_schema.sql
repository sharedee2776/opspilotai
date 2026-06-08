-- OpsPilot full schema (idempotent). Safe to run on every deploy.

DO $$ BEGIN
  CREATE TYPE organization_members_role_enum AS ENUM ('owner', 'admin', 'member');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE team_members_role_enum AS ENUM ('lead', 'member');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE alerts_severity_enum AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE alerts_status_enum AS ENUM ('pending', 'grouped', 'resolved');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE alerts_source_enum AS ENUM ('slack', 'datadog', 'cloudwatch');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE incidents_status_enum AS ENUM ('active', 'investigating', 'resolved');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE actions_status_enum AS ENUM ('suggested', 'approved', 'executing', 'success', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE integrations_type_enum AS ENUM ('slack', 'datadog', 'cloudwatch');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar NOT NULL UNIQUE,
  name varchar NOT NULL,
  "passwordHash" varchar NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar NOT NULL,
  slug varchar NOT NULL UNIQUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organizationId" uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  "userId" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role organization_members_role_enum NOT NULL DEFAULT 'member',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("organizationId", "userId")
);

CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organizationId" uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name varchar NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "teamId" uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  "userId" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role team_members_role_enum NOT NULL DEFAULT 'member',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("teamId", "userId")
);

CREATE TABLE IF NOT EXISTS incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organizationId" uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title varchar NOT NULL,
  summary text,
  "rootCause" text,
  status incidents_status_enum NOT NULL DEFAULT 'active',
  service varchar,
  "alertCount" integer NOT NULL DEFAULT 0,
  "suggestedFixes" jsonb NOT NULL DEFAULT '[]',
  "slackChannelId" varchar,
  "slackMessageTs" varchar,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organizationId" uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  "integrationId" uuid,
  title varchar NOT NULL,
  description text,
  service varchar NOT NULL,
  severity alerts_severity_enum NOT NULL DEFAULT 'medium',
  status alerts_status_enum NOT NULL DEFAULT 'pending',
  source alerts_source_enum NOT NULL DEFAULT 'slack',
  "dedupHash" varchar,
  metadata jsonb NOT NULL DEFAULT '{}',
  "incidentId" uuid REFERENCES incidents(id) ON DELETE SET NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organizationId" uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name varchar NOT NULL,
  type varchar NOT NULL,
  command text,
  status actions_status_enum NOT NULL DEFAULT 'suggested',
  "riskLevel" varchar,
  "incidentId" uuid REFERENCES incidents(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

CREATE INDEX IF NOT EXISTS idx_alerts_org_dedup_created ON alerts ("organizationId", "dedupHash", "createdAt");
CREATE INDEX IF NOT EXISTS idx_alerts_org_service_status ON alerts ("organizationId", service, status);
CREATE INDEX IF NOT EXISTS idx_incidents_org_service_status ON incidents ("organizationId", service, status);
CREATE INDEX IF NOT EXISTS idx_integrations_org_type ON integrations ("organizationId", type);
