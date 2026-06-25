-- Add settings JSONB column to organizations (idempotent).
-- Required for per-org runtime config: defaultSlackChannelId, etc.
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS settings jsonb NOT NULL DEFAULT '{}';
