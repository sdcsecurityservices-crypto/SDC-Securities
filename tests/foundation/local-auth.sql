-- Fixture only: emulates Supabase identity in a disposable local PostgreSQL DB.
create schema auth;
create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz default now());
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
grant usage on schema auth to authenticated;
grant execute on function auth.uid() to authenticated;
