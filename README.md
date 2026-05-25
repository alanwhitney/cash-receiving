# Cash Receiving

Vendor and inventory receiving management — built with Next.js, Supabase, and Vercel.

## Features

- **Vendors** — manage vendors with contacts (name, email, phone) and items
- **Items** — track UPC, case cost, case size, discount, unit retail; margin auto-calculated and color-coded against department target
- **Price history** — automatic history log every time item cost or retail changes
- **Departments** — organize items by department with target margin thresholds
- **Receiving sessions** — scan UPCs with a Bluetooth scanner to receive shipments; override case cost/discount per session; optionally apply cost changes to item records on completion
- **Responsive** — tablet-first layout with bottom nav on mobile, sidebar on desktop

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/migrations/001_initial.sql` in the Supabase SQL editor
3. Copy your project URL and anon key

### 2. Local development

```bash
cp .env.local.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY

npm install
npm run dev
```

### 3. Vercel deployment

1. Push to GitHub
2. Import the repo in Vercel
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

## Margin calculation

```
unit_cost  = (case_cost × (1 − case_discount/100)) / case_size
margin %   = (unit_retail − unit_cost) / unit_retail × 100
```

Color coding vs department target margin: green ≥ target, yellow within 5%, red below.

## UPC scanning

The receive page auto-focuses a scan input. Bluetooth scanners emulate keyboard input followed by Enter — the app detects this and looks up the item instantly. Manual UPC entry also works by typing the code and pressing Enter or the Find button.
