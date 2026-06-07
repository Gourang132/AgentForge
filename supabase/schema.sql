-- Run this in Supabase SQL Editor: https://supabase.com → your project → SQL Editor

-- 1. Users table
create table if not exists users (
  id uuid default gen_random_uuid() primary key,
  clerk_id text unique not null,
  plan text default 'starter' check (plan in ('starter','builder','enterprise')),
  usage_count integer default 0,
  plan_expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Products table
create table if not exists products (
  id uuid default gen_random_uuid() primary key,
  clerk_id text not null references users(clerk_id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  name text not null default 'New Product',
  system_prompt text default 'You are a helpful AI assistant.',
  model text default 'llama-3.3-70b-versatile',
  temperature float default 0.7,
  icon text default '🤖',
  rag_enabled boolean default true,
  memory_enabled boolean default true,
  monetize boolean default false,
  call_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. RAG chunks table
create table if not exists rag_chunks (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references products(id) on delete cascade,
  user_clerk_id text not null,
  text text not null,
  chunk_index integer default 0,
  file_name text,
  file_path text,
  created_at timestamptz default now()
);

-- 4. Usage logs
create table if not exists usage_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  tokens_used integer default 0,
  created_at timestamptz default now()
);

-- 5. Payments
create table if not exists payments (
  id uuid default gen_random_uuid() primary key,
  clerk_id text not null,
  plan text not null,
  razorpay_payment_id text unique,
  amount integer,
  currency text default 'INR',
  created_at timestamptz default now()
);

-- 6. Row Level Security (RLS) — users only see their own data
alter table users enable row level security;
alter table products enable row level security;
alter table rag_chunks enable row level security;
alter table usage_logs enable row level security;

-- Note: We use service_role key in API routes which bypasses RLS
-- These policies protect direct Supabase client access

-- 7. Indexes for performance
create index if not exists idx_products_clerk_id on products(clerk_id);
create index if not exists idx_rag_chunks_product_id on rag_chunks(product_id);
create index if not exists idx_usage_logs_user_id on usage_logs(user_id);
create index if not exists idx_users_clerk_id on users(clerk_id);

-- 8. Storage bucket for RAG file uploads
-- Run this in Supabase Dashboard → Storage → New Bucket
-- Bucket name: rag-files
-- Public: false

-- 9. Helper: reset usage monthly (set up as cron in Supabase)
-- create or replace function reset_monthly_usage()
-- returns void as $$
-- update users set usage_count = 0, updated_at = now();
-- $$ language sql;
