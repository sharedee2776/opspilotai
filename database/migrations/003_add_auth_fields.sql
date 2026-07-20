-- Add email verification and password reset support to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verified     BOOLEAN          NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS verification_token TEXT,
  ADD COLUMN IF NOT EXISTS verification_expires TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reset_token        TEXT,
  ADD COLUMN IF NOT EXISTS reset_expires      TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token) WHERE verification_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_reset_token        ON users(reset_token)        WHERE reset_token IS NOT NULL;
