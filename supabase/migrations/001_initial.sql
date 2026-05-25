-- ============================================================
-- Profiles (mirrors auth.users for display purposes)
-- ============================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and update own profile" ON public.profiles
  FOR ALL USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================
-- Departments
-- ============================================================
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_margin NUMERIC(5,2) NOT NULL DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own departments" ON public.departments
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- Vendors
-- ============================================================
CREATE TABLE public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own vendors" ON public.vendors
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- Contacts
-- ============================================================
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage contacts via vendor ownership" ON public.contacts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.vendors
      WHERE id = contacts.vendor_id AND user_id = auth.uid()
    )
  );

-- ============================================================
-- Items
-- ============================================================
CREATE TABLE public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  upc TEXT NOT NULL,
  case_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  case_size INTEGER NOT NULL DEFAULT 1,
  case_discount NUMERIC(5,2) NOT NULL DEFAULT 0,
  unit_retail NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT upc_unique UNIQUE (upc)
);

ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage items via vendor ownership" ON public.items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.vendors
      WHERE id = items.vendor_id AND user_id = auth.uid()
    )
  );

-- ============================================================
-- Item Price History (auto-populated via trigger)
-- ============================================================
CREATE TABLE public.item_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  case_cost NUMERIC(10,2) NOT NULL,
  case_size INTEGER NOT NULL,
  case_discount NUMERIC(5,2) NOT NULL,
  unit_retail NUMERIC(10,2) NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.item_price_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view price history via item ownership" ON public.item_price_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.items i
      JOIN public.vendors v ON v.id = i.vendor_id
      WHERE i.id = item_price_history.item_id AND v.user_id = auth.uid()
    )
  );

-- Auto-log price changes
CREATE OR REPLACE FUNCTION public.log_price_history()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    OLD.case_cost != NEW.case_cost OR
    OLD.unit_retail != NEW.unit_retail OR
    OLD.case_discount != NEW.case_discount OR
    OLD.case_size != NEW.case_size
  ) THEN
    INSERT INTO public.item_price_history (item_id, case_cost, case_size, case_discount, unit_retail)
    VALUES (OLD.id, OLD.case_cost, OLD.case_size, OLD.case_discount, OLD.unit_retail);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_item_price_change
  BEFORE UPDATE ON public.items
  FOR EACH ROW EXECUTE PROCEDURE public.log_price_history();

-- ============================================================
-- Receive Sessions
-- ============================================================
CREATE TABLE public.receive_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'completed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.receive_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own receive sessions" ON public.receive_sessions
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- Receive Lines
-- ============================================================
CREATE TABLE public.receive_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.receive_sessions(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  cases_received INTEGER NOT NULL DEFAULT 1,
  case_cost_override NUMERIC(10,2),
  case_discount_override NUMERIC(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.receive_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage lines via session ownership" ON public.receive_lines
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.receive_sessions
      WHERE id = receive_lines.session_id AND user_id = auth.uid()
    )
  );

-- ============================================================
-- updated_at triggers
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON public.vendors
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TRIGGER update_departments_updated_at
  BEFORE UPDATE ON public.departments
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TRIGGER update_items_updated_at
  BEFORE UPDATE ON public.items
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- ============================================================
-- Performance indexes
-- ============================================================
CREATE INDEX idx_vendors_user_id ON public.vendors(user_id);
CREATE INDEX idx_departments_user_id ON public.departments(user_id);
CREATE INDEX idx_items_vendor_id ON public.items(vendor_id);
CREATE INDEX idx_items_upc ON public.items(upc);
CREATE INDEX idx_items_department_id ON public.items(department_id);
CREATE INDEX idx_contacts_vendor_id ON public.contacts(vendor_id);
CREATE INDEX idx_price_history_item_id ON public.item_price_history(item_id);
CREATE INDEX idx_receive_sessions_user_id ON public.receive_sessions(user_id);
CREATE INDEX idx_receive_lines_session_id ON public.receive_lines(session_id);
