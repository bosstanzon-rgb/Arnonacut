-- Israel News — planned Postgres / Supabase schema
-- Not required to run the app. Mock data in lib/mock-articles.ts is used locally.

create extension if not exists "pgcrypto";

create type public.article_category as enum (
  'Security',
  'Politics',
  'Israel',
  'Economy',
  'Society',
  'Technology',
  'International',
  'Other'
);

create type public.article_importance as enum (
  'BREAKING',
  'MAJOR',
  'UPDATE',
  'OTHER'
);

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  headline_en text not null,
  summary_en text not null,
  source_name text not null,
  original_published_at timestamptz not null,
  category public.article_category not null,
  importance public.article_importance not null default 'OTHER',
  original_url text not null,
  created_at timestamptz not null default now()
);

create index articles_published_at_idx
  on public.articles (original_published_at desc);

create index articles_category_idx
  on public.articles (category);

alter table public.articles enable row level security;

create policy "Public read articles"
  on public.articles
  for select
  to anon, authenticated
  using (true);
