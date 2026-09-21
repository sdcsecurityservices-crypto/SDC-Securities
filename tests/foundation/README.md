# Foundation database tests

Use a disposable local PostgreSQL database and a local superuser. The runner deliberately rejects remote hosts. Never apply the auth/storage fixture files to Supabase.

Create cluster roles `anon` and `authenticated` if absent. In a new test database, apply these files with `psql -v ON_ERROR_STOP=1`, in order:

1. `tests/foundation/local-auth.sql`
2. `supabase/migrations/20260921124925_foundation.sql`
3. `tests/foundation/local-storage.sql`
4. `supabase/migrations/20260921125647_foundation_storage.sql`

Run `SDC_TEST_DATABASE_URL=postgres://LOCAL_USER@127.0.0.1:LOCAL_PORT/DISPOSABLE_DB npm run test:foundation`.

The suite switches to the actual PostgreSQL authenticated role and supplies a fixture user ID to exercise RLS. It covers isolation, unauthorized writes, concurrent revisions, audit immutability, archive dependencies, staffing uniqueness, revocation, idempotent seeding, storage isolation and orphan cleanup. It does not exercise Supabase's JWT verifier, GoTrue session refresh, signed-URL generation, storage HTTP service or authenticated browser flows; those need integration acceptance in the connected Supabase project.

Drop the disposable database and stop its local server after testing.
