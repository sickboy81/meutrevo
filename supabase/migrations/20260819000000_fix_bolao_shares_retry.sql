-- Migration: Fix bolao_shares after failed 20260818235000
-- This is a retry that works on the ORIGINAL state (UUID, auth.users FK, old policies)
-- Safe to run even if 20260818235000 was never applied

-- ========== UP ==========

-- 1. Drop existing policies (required before ALTER COLUMN TYPE)
DROP POLICY IF EXISTS "Public can read active shares" ON bolao_shares;
DROP POLICY IF EXISTS "Users can create own shares" ON bolao_shares;
DROP POLICY IF EXISTS "Users can update own shares" ON bolao_shares;

-- 2. Drop FK (required before ALTER COLUMN TYPE)
ALTER TABLE bolao_shares DROP CONSTRAINT IF EXISTS bolao_shares_user_id_fkey;

-- 3. Convert user_id from UUID to TEXT
ALTER TABLE bolao_shares
  ALTER COLUMN user_id TYPE TEXT USING user_id::text;

-- 4. Add FK to public.users(id) (matches all other tables in the project)
ALTER TABLE bolao_shares
  ADD CONSTRAINT bolao_shares_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 5. Recreate policies with correct types
CREATE POLICY "Public can read active shares"
  ON bolao_shares
  FOR SELECT
  USING (
    is_active = true
    AND revoked_at IS NULL
    AND (expires_at IS NULL OR expires_at > NOW())
  );

CREATE POLICY "Users can create own shares"
  ON bolao_shares
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own shares"
  ON bolao_shares
  FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- 6. Backfill: migrate data from bolao_public_access into bolao_shares
-- Only inserts shares that don't already exist in bolao_shares
INSERT INTO bolao_shares (
  share_code, user_id, lottery_id, lottery_name,
  contest_num, games_snapshot, cotas, taxa,
  summary_text, is_active, created_at, revoked_at, expires_at
)
SELECT
  LOWER(bpa.share_code),
  b.creator_id,
  b.lottery,
  CASE b.lottery
    WHEN 'lotofacil' THEN 'Lotofácil'
    WHEN 'megasena' THEN 'Mega-Sena'
    WHEN 'lotomania' THEN 'Lotomania'
    WHEN 'quina' THEN 'Quina'
    WHEN 'diadesorte' THEN 'Dia de Sorte'
    WHEN 'loteca' THEN 'Loteca'
    WHEN 'loteriafederal' THEN 'Loteria Federal'
    WHEN 'timemania' THEN 'Timemania'
    WHEN 'duplasena' THEN 'Dupla Sena'
    WHEN 'lotogol' THEN 'Lotogol'
    ELSE b.lottery
  END,
  NULL,
  b.games_json::jsonb,
  b.cotas_total,
  b.taxa_pct,
  '',
  true,
  COALESCE(bpa.created_at, NOW()),
  NULL,
  NULL
FROM bolao_public_access bpa
JOIN boloes b ON b.id = bpa.bolao_id
WHERE NOT EXISTS (
  SELECT 1 FROM bolao_shares bs WHERE bs.share_code = LOWER(bpa.share_code)
)
ON CONFLICT (share_code) DO NOTHING;

-- 7. Create validation view
CREATE OR REPLACE VIEW bolao_share_migration_check AS
SELECT
  (SELECT COUNT(*)::bigint FROM bolao_public_access) AS count_old,
  (SELECT COUNT(*)::bigint FROM bolao_shares) AS count_new,
  (SELECT COUNT(*)::bigint FROM bolao_public_access bpa
   WHERE NOT EXISTS (
     SELECT 1 FROM bolao_shares bs WHERE bs.share_code = LOWER(bpa.share_code)
   )) AS count_missing,
  (SELECT COUNT(*)::bigint FROM bolao_public_access bpa
   WHERE EXISTS (
     SELECT 1 FROM bolao_shares bs WHERE bs.share_code = LOWER(bpa.share_code)
   )) AS count_duplicate,
  (SELECT COUNT(*)::bigint FROM bolao_shares
   WHERE expires_at IS NOT NULL AND expires_at <= NOW()) AS count_expired,
  NOW() AS checked_at;

-- ========== DOWN ==========

DROP VIEW IF EXISTS bolao_share_migration_check;

DROP POLICY IF EXISTS "Public can read active shares" ON bolao_shares;
DROP POLICY IF EXISTS "Users can create own shares" ON bolao_shares;
DROP POLICY IF EXISTS "Users can update own shares" ON bolao_shares;

ALTER TABLE bolao_shares DROP CONSTRAINT IF EXISTS bolao_shares_user_id_fkey;

-- Only allow rollback if all user_id values are valid UUIDs
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM bolao_shares
    WHERE user_id IS NOT NULL
      AND user_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    LIMIT 1
  ) THEN
    RAISE EXCEPTION 'Cannot rollback: found non-UUID user_id values in bolao_shares';
  END IF;
END $$;

ALTER TABLE bolao_shares
  ALTER COLUMN user_id TYPE UUID USING user_id::uuid;

ALTER TABLE bolao_shares
  ADD CONSTRAINT bolao_shares_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE POLICY "Public can read active shares"
  ON bolao_shares FOR SELECT
  USING (is_active = true AND revoked_at IS NULL);

CREATE POLICY "Users can create own shares"
  ON bolao_shares FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shares"
  ON bolao_shares FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
