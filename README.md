# SDC — Security. With intelligence.

A client-ready website and private operations demonstration built with React, Vinext, TypeScript, Radix/Shadcn and Cloudflare D1.

- `/`: SDC marketing website
- `/command`: authenticated demonstration workspace
- `/api/operations`: authenticated, owner-isolated state and validated demo actions

Read `docs/CLIENT-WALKTHROUGH.md` for the presentation flow, source decisions and production boundaries.

## Local development

Run `npm run dev` and open the URL it prints. The portable Sites development integration supplies mock authentication on localhost when visiting `/command`; it is not included in production authentication.

D1 setup: `npm run db:generate` only after schema changes. Build with `npm run build`, then apply the pending migration locally:

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_moaning_whirlwind.sql
```

Do not replay an applied migration. Production migration and publishing are managed through Sites. Secrets are not required for the demo.

## Verification

`npx tsc --noEmit` and `npm run build` validate types and the Worker bundle. `tests/operations-smoke.mjs` exercises the local API and changes fictional localhost records. See its setup requirements before running. Browser validation covers navigation, a published assignment that survives reload, mobile layouts, role switching, CSV review and the WebMCP roster reader.

The private demo stores each owner’s sample state in a versioned D1 row; optimistic concurrency prevents one window from overwriting another. Production staff authorization must be implemented using server-owned roles rather than the demonstration’s explicit role selector.
