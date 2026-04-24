-- 001_initial_schema.sql  (exact DDL from Notion Tech Doc)
-- Run: supabase db push  OR  psql $DATABASE_URL -f 001_initial_schema.sql

create extension if not exists "uuid-ossp";
create extension if not exists pg_trgm;

-- ── profiles ─────────────────────────────────────────────────────────────────
create table if not exists profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  display_name        text,
  age_range           text not null check (age_range in ('under_18','18_24','25_34','35_44','45_54','55_plus')),
  gender              text not null check (gender in ('female','male','non_binary','prefer_not_to_say')),
  skin_type           text not null check (skin_type in ('sensitive','dry','oily','combination','normal')),
  skin_goals          jsonb not null default '[]',
  allergies           jsonb not null default '[]',
  life_stage          text check (life_stage in ('none','pregnant','nursing','ttc','parent_of_infant')),
  onboarding_complete boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table profiles enable row level security;
create policy "users can read own profile"   on profiles for select using (auth.uid() = id);
create policy "users can upsert own profile" on profiles for insert with check (auth.uid() = id);
create policy "users can update own profile" on profiles for update using (auth.uid() = id);

-- ── categories ────────────────────────────────────────────────────────────────
create table if not exists categories (
  slug                      text primary key,
  display_name              text not null,
  display_order             int  not null default 0,
  is_required_in_onboarding boolean not null default false,
  icon                      text
);

insert into categories (slug, display_name, display_order, is_required_in_onboarding) values
  ('shampoo',           'Shampoo',           1,  true),
  ('conditioner',       'Conditioner',        2,  true),
  ('body_wash',         'Body Wash',          3,  true),
  ('face_cleanser',     'Face Cleanser',      4,  true),
  ('moisturizer',       'Moisturizer',        5,  true),
  ('sunscreen',         'Sunscreen',          6,  true),
  ('deodorant',         'Deodorant',          7,  true),
  ('toothpaste',        'Toothpaste',         8,  true),
  ('lip_balm',          'Lip Balm',           9,  false),
  ('makeup_foundation', 'Foundation',         10, false),
  ('serum',             'Serum',              11, false),
  ('eye_cream',         'Eye Cream',          12, false)
on conflict (slug) do nothing;

-- ── products ──────────────────────────────────────────────────────────────────
create table if not exists products (
  id                 uuid primary key default gen_random_uuid(),
  off_id             text unique,
  name               text not null,
  brand              text,
  category_slug      text references categories(slug),
  ingredients_raw    text,
  ingredients_parsed jsonb not null default '[]',
  image_url          text,
  source             text not null default 'open_beauty_facts',
  popularity         int  not null default 0,
  last_fetched_at    timestamptz,
  created_at         timestamptz not null default now()
);

create index if not exists products_name_trgm  on products using gin (name gin_trgm_ops);
create index if not exists products_brand_trgm on products using gin (brand gin_trgm_ops);
create index if not exists products_category   on products (category_slug);
create index if not exists products_popularity on products (category_slug, popularity desc);

-- ── ingredients ───────────────────────────────────────────────────────────────
create table if not exists ingredients (
  id                 uuid primary key default gen_random_uuid(),
  inci_name          text not null unique,
  common_name        text,
  cas_number         text,
  category           text,
  function_short     text,
  plain_english      text not null,
  hazard_tags        jsonb not null default '[]',
  goals_against      jsonb not null default '[]',
  bad_for_skin_types jsonb not null default '[]',
  dose_notes         text,
  created_at         timestamptz not null default now()
);

create index if not exists ingredients_inci_trgm on ingredients using gin (inci_name gin_trgm_ops);
create index if not exists ingredients_tags      on ingredients using gin (hazard_tags);
create index if not exists ingredients_goals     on ingredients using gin (goals_against);

-- ── product_ingredients ───────────────────────────────────────────────────────
create table if not exists product_ingredients (
  product_id    uuid references products(id) on delete cascade,
  ingredient_id uuid references ingredients(id) on delete cascade,
  position      int,
  primary key (product_id, ingredient_id)
);

create index if not exists product_ingredients_ingredient on product_ingredients (ingredient_id);

-- ── bans ──────────────────────────────────────────────────────────────────────
create table if not exists bans (
  id             uuid primary key default gen_random_uuid(),
  ingredient_id  uuid not null references ingredients(id) on delete cascade,
  region         text not null,
  status         text not null check (status in ('banned','restricted','requires_warning')),
  regulation_ref text,
  source_url     text,
  reason         text,
  effective_date date,
  created_at     timestamptz not null default now()
);

create index if not exists bans_ingredient on bans (ingredient_id);
create index if not exists bans_region     on bans (region);

-- ── analogies ─────────────────────────────────────────────────────────────────
create table if not exists analogies (
  id                uuid primary key default gen_random_uuid(),
  ingredient_id     uuid not null references ingredients(id) on delete cascade,
  goal_slug         text,
  analogy_one_liner text not null,
  full_explanation  text not null,
  source            text not null default 'curated' check (source in ('curated','llm_generated')),
  fact_check_passed boolean not null default true,
  created_at        timestamptz not null default now(),
  unique (ingredient_id, goal_slug)
);

create index if not exists analogies_ingredient on analogies (ingredient_id);

-- ── alternatives ──────────────────────────────────────────────────────────────
create table if not exists alternatives (
  id                  uuid primary key default gen_random_uuid(),
  category_slug       text not null references categories(slug),
  product_name        text not null,
  brand               text not null,
  free_of_tags        jsonb not null default '[]',
  good_for_skin_types jsonb not null default '[]',
  good_for_goals      jsonb not null default '[]',
  avg_price_usd       numeric(10,2),
  url                 text,
  image_url           text,
  reason              text,
  created_at          timestamptz not null default now()
);

create index if not exists alternatives_category  on alternatives (category_slug);
create index if not exists alternatives_free_tags on alternatives using gin (free_of_tags);

-- ── user_products ─────────────────────────────────────────────────────────────
create table if not exists user_products (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  product_id         uuid references products(id) on delete cascade,   -- nullable: paste path
  category_slug      text references categories(slug),
  custom_name        text,
  custom_ingredients text,
  added_at           timestamptz not null default now()
);

create index if not exists user_products_user on user_products (user_id);
alter table user_products enable row level security;
create policy "users see own products"    on user_products for select using (auth.uid() = user_id);
create policy "users insert own products" on user_products for insert with check (auth.uid() = user_id);
create policy "users delete own products" on user_products for delete using (auth.uid() = user_id);

-- ── analyses ──────────────────────────────────────────────────────────────────
create table if not exists analyses (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  status           text not null default 'pending' check (status in ('pending','running','completed','failed')),
  profile_snapshot jsonb not null default '{}',
  user_product_ids jsonb not null default '[]',
  output           jsonb,
  llm_model        text,
  total_tokens     int,
  duration_ms      int,
  error            text,
  created_at       timestamptz not null default now(),
  completed_at     timestamptz
);

create index if not exists analyses_user on analyses (user_id, created_at desc);
alter table analyses enable row level security;
create policy "users read own analyses" on analyses for select using (auth.uid() = user_id);

-- ── analysis_runs ─────────────────────────────────────────────────────────────
create table if not exists analysis_runs (
  id          uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references analyses(id) on delete cascade,
  agent_name  text not null,
  input       jsonb,
  output      jsonb,
  duration_ms int,
  tokens_used int,
  error       text,
  created_at  timestamptz not null default now()
);

create index if not exists analysis_runs_analysis on analysis_runs (analysis_id);
