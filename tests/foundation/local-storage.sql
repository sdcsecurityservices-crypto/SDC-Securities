-- Minimal Storage catalog fixture for disposable PostgreSQL policy tests only.
-- Supabase owns these objects in production; never apply this file there.
create schema storage;
create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
create function storage.foldername(text) returns text[] language sql immutable as $$select (string_to_array($1,'/'))[1:array_length(string_to_array($1,'/'),1)-1]$$;
grant usage on schema storage to authenticated;
grant select,insert,delete on storage.objects to authenticated;
alter table storage.objects enable row level security;
