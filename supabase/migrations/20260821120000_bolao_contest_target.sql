-- Keep the contest targeted by a pool explicit and backward compatible.
ALTER TABLE public.boloes
  ADD COLUMN IF NOT EXISTS contest_num integer;

CREATE INDEX IF NOT EXISTS idx_boloes_lottery_contest
  ON public.boloes (lottery, contest_num);
