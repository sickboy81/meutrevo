-- Migration: Unify bolao sharing into bolao_shares table (SAFE, no DROP)
--
-- UP:
-- - Convert bolao_shares.user_id UUID -> TEXT
-- - Replace FK auth.users -> public.users
-- - Update RLS policies to compare auth.uid()::text
-- - Backfill bolao_public_access -> bolao_shares
-- - Create VIEW bolao_share_migration_check for validation
--
-- DOWN:
-- - Drop validation view
-- - Restore original RLS + FK to auth.users
-- - Attempt to convert user_id TEXT -> UUID (only if all values are UUID-like)
-- - Keep bolao_public_access intact

-- ========== UP ==========

DROP POLICY IF EXISTS "Public can read active shares" ON bolao_shares;
DROP POLICY IF EXISTS "Users can create own shares" ON bolao_shares;
DROP POLICY IF EXISTS "Users can update own shares" ON bolao_shares;

ALTER TABLE bolao_shares DROP CONSTRAINT IF EXISTS bolao_shares_user_id_fkey;

ALTER TABLE bolao_shares
  ALTER COLUMN user_id TYPE TEXT USING user_id::text;

ALTER TABLE bolao_shares
  ADD CONSTRAINT bolao_shares_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

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

INSERT INTO bolao_shares (
  share_code,
  user_id,
  lottery_id,
  lottery_name,
  contest_num,
  games_snapshot,
  cotas,
  taxa,
  summary_text,
  is_active,
  created_at,
  revoked_at,
  expires_at
)
SELECT
  LOWER(bpa.share_code),
  b.creator_id,
  b.lottery,
  COALESCE(lc.name, b.lottery),
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
LEFT JOIN (
  VALUES
    ('lotofacil', 'Lotofácil'),
    ('megasena', 'Mega-Sena'),
    ('lotomania', 'Lotomania'),
    ('quina', 'Quina'),
    ('diadesorte', 'Dia de Sorte'),
    ('loteca', 'Loteca'),
    ('loteriafederal', 'Loteria Federal'),
    ('timemania', 'Timemania'),
    ('duplasena', 'Dupla Sena'),
    ('lotogol', 'Lotogol')
  ) AS lc(key, name) ON lc.key = b.lottery
WHERE NOT EXISTS (
  SELECT 1 FROM bolao_shares bs WHERE bs.share_code = LOWER(bpa.share_code)
)
ON CONFLICT (share_code) DO NOTHING;

CREATE OR REPLACE VIEW bolao_share_migration_check AS
SELECT
  (SELECT COUNT(*)::bigint FROM bolao_public_access) AS count_old,
  (SELECT COUNT(*)::bigint FROM bolao_shares) AS count_new,
  (
    SELECT COUNT(*)::bigint
    FROM bolao_public_access bpa
    WHERE NOT EXISTS (
      SELECT 1 FROM bolao_shares bs WHERE bs.share_code = LOWER(bpa.share_code)
    )
  ) AS count_missing,
  (
    SELECT COUNT(*)::bigint
    FROM bolao_public_access bpa
    WHERE EXISTS (
      SELECT 1 FROM bolao_shares bs WHERE bs.share_code = LOWER(bpa.share_code)
    )
  ) AS count_duplicate,
  (
    SELECT COUNT(*)::bigint
    FROM bolao_shares
    WHERE expires_at IS NOT NULL AND expires_at <= NOW()
  ) AS count_expired,
  NOW() AS checked_at;

-- ========== DOWN ==========

DROP VIEW IF EXISTS bolao_share_migration_check;

DROP POLICY IF EXISTS "Public can read active shares" ON bolao_shares;
DROP POLICY IF EXISTS "Users can create own shares" ON bolao_shares;
DROP POLICY IF EXISTS "Users can update own shares" ON bolao_shares;

ALTER TABLE bolao_shares DROP CONSTRAINT IF EXISTS bolao_shares_user_id_fkey;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM bolao_shares
    WHERE user_id IS NOT NULL
      AND user_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    LIMIT 1
  ) THEN
    RAISE EXCEPTION 'Cannot rollback bolao_shares.user_id to UUID: found non-UUID user_id value(s).';
  END IF;
END $$;

ALTER TABLE bolao_shares
  ALTER COLUMN user_id TYPE UUID USING user_id::uuid;

ALTER TABLE bolao_shares
  ADD CONSTRAINT bolao_shares_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE POLICY "Public can read active shares"
  ON bolao_shares
  FOR SELECT
  USING (is_active = true AND revoked_at IS NULL);

CREATE POLICY "Users can create own shares"
  ON bolao_shares
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shares"
  ON bolao_shares
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
