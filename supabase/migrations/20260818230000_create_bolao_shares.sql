-- Migration: Create bolao_shares table for QR code sharing
-- This table stores shareable links for lottery pools (bolões)

CREATE TABLE IF NOT EXISTS bolao_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_code TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lottery_id TEXT NOT NULL,
  lottery_name TEXT NOT NULL,
  contest_num TEXT,
  games_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
  cotas INTEGER NOT NULL DEFAULT 1,
  taxa NUMERIC(5,2) NOT NULL DEFAULT 0,
  summary_text TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);

-- Index for fast lookup by share_code (used by public API)
CREATE INDEX IF NOT EXISTS idx_bolao_shares_code ON bolao_shares(share_code);

-- Index for user's shares (used by revoke endpoint)
CREATE INDEX IF NOT EXISTS idx_bolao_shares_user ON bolao_shares(user_id);

-- Enable Row Level Security
ALTER TABLE bolao_shares ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active, non-revoked shares (for public page)
CREATE POLICY "Public can read active shares"
  ON bolao_shares
  FOR SELECT
  USING (is_active = true AND revoked_at IS NULL);

-- Policy: Authenticated users can insert their own shares
CREATE POLICY "Users can create own shares"
  ON bolao_shares
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own shares (for revocation)
CREATE POLICY "Users can update own shares"
  ON bolao_shares
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
