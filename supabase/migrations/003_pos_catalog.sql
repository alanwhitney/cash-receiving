-- ============================================================
-- POS Catalog (imported from register PLU/sales dumps)
-- Used to pre-seed item Description and Price by UPC when adding items.
-- ============================================================
CREATE TABLE public.pos_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plu TEXT NOT NULL,
  upc TEXT,
  description TEXT NOT NULL,
  price NUMERIC(10,2),
  imported_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT pos_catalog_user_plu_unique UNIQUE (user_id, plu)
);

ALTER TABLE public.pos_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own pos_catalog" ON public.pos_catalog
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_pos_catalog_user_id ON public.pos_catalog(user_id);
CREATE INDEX idx_pos_catalog_user_upc ON public.pos_catalog(user_id, upc);
