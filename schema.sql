-- ─────────────────────────────────────
-- AgentForge — Supabase Database Schema
-- Run this in Supabase → SQL Editor
-- ─────────────────────────────────────

-- 1. USER PROFILES
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null,
  email       text not null,
  plan        text default 'free',  -- free | builder | enterprise
  avatar_url  text,
  created_at  timestamptz default now()
);

-- 2. AI PRODUCTS
create table if not exists products (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references profiles(id) on delete cascade,
  name          text not null,
  description   text,
  system_prompt text,
  model         text default 'llama-3.3-70b-versatile',
  price         numeric default 0,
  price_type    text default 'free',  -- free | subscription | one_time
  is_public     boolean default false,
  slug          text unique,
  stats         jsonb default '{"users": 0, "messages": 0, "revenue": 0}',
  created_at    timestamptz default now()
);

-- 3. KNOWLEDGE FILES (RAG)
create table if not exists knowledge_files (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid references products(id) on delete cascade,
  user_id     uuid references profiles(id) on delete cascade,
  filename    text not null,
  file_path   text,
  file_size   integer,
  chunks      integer default 0,
  status      text default 'processing',  -- processing | indexed | failed
  created_at  timestamptz default now()
);

-- 4. CHAT LOGS
create table if not exists chat_logs (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid references products(id) on delete cascade,
  user_message  text,
  ai_response   text,
  model         text,
  tokens        integer default 0,
  created_at    timestamptz default now()
);

-- 5. ORDERS (Razorpay)
create table if not exists orders (
  id          text primary key,  -- Razorpay order ID
  user_id     uuid references profiles(id),
  product_id  uuid references products(id),
  amount      integer not null,  -- in paise
  currency    text default 'INR',
  status      text default 'created',  -- created | paid | failed
  payment_id  text,
  paid_at     timestamptz,
  created_at  timestamptz default now()
);

-- 6. SUBSCRIPTIONS
create table if not exists subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references profiles(id),
  product_id  uuid references products(id),
  order_id    text references orders(id),
  status      text default 'active',  -- active | expired | cancelled
  started_at  timestamptz default now(),
  expires_at  timestamptz
);

-- ─────────────────────────────────────
-- ROW LEVEL SECURITY (RLS)
-- Users can only see their own data
-- ─────────────────────────────────────

alter table profiles         enable row level security;
alter table products         enable row level security;
alter table knowledge_files  enable row level security;
alter table chat_logs        enable row level security;
alter table orders           enable row level security;
alter table subscriptions    enable row level security;

-- Profiles: own row only
create policy "Users see own profile"
  on profiles for all
  using (auth.uid() = id);

-- Products: own products
create policy "Users manage own products"
  on products for all
  using (auth.uid() = user_id);

-- Products: public can read public products
create policy "Public can read public products"
  on products for select
  using (is_public = true);

-- Knowledge files: own files
create policy "Users manage own knowledge"
  on knowledge_files for all
  using (auth.uid() = user_id);

-- Chat logs: product owner
create policy "Users see own chat logs"
  on chat_logs for all
  using (
    auth.uid() = (
      select user_id from products where id = product_id
    )
  );

-- Orders: own orders
create policy "Users see own orders"
  on orders for all
  using (auth.uid() = user_id);

-- Subscriptions: own subscriptions
create policy "Users see own subscriptions"
  on subscriptions for all
  using (auth.uid() = user_id);

-- ─────────────────────────────────────
-- STORAGE BUCKET FOR FILES
-- Run this in Supabase → Storage
-- ─────────────────────────────────────
-- Create a bucket called "knowledge"
-- Set it to private (not public)
-- Max file size: 50MB

insert into storage.buckets (id, name, public)
values ('knowledge', 'knowledge', false)
on conflict do nothing;

-- Storage policy: users access own files
create policy "Users access own files"
  on storage.objects for all
  using (auth.uid()::text = (storage.foldername(name))[1]);
