# AgroBrain Crop Advisory

AgroBrain helps farmers turn farm conditions into structured, actionable crop advisories with persistence, ownership isolation, and server-side Gemini generation.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — injected by Replit PostgreSQL
- Required secret: `GEMINI_API_KEY` — server-only Gemini access

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for all user, farm, advisory, and dashboard contracts
- `lib/db/src/schema/` — Drizzle schema for users, farms, and advisories
- `artifacts/api-server/src/routes/agrobrain.ts` — ownership-scoped REST routes
- `artifacts/api-server/src/lib/agrobrain-ai.ts` — Gemini prompt, response schema, and normalization
- `artifacts/agrobrain/src/` — React routes, shell, forms, dashboard, and printable report view

## Architecture decisions

- The MVP uses a generated x-user-id session header instead of local auth; all farm/advisory queries enforce ownership through server-side WHERE clauses and joins.
- OpenAPI is the contract for both generated React Query hooks and backend Zod response validation.
- Gemini runs only in the API server and returns provider snake_case JSON that is validated and normalized to the frontend camelCase report model before persistence.
- The app uses one shared API service behind `/api` and a root web artifact so browser requests remain same-origin in preview and deployment.

## Product

- Public product landing page
- Persistent farm profiles with soil, irrigation, climate, region, acreage, and historic crop details
- Dashboard summary with saved farms and advisory history
- Server-generated, validated crop recommendations, soil preparation, pest management, irrigation, ROI, and sustainability guidance
- Printable advisory report view for offline field use

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Add `GEMINI_API_KEY` as a workspace secret before using Generate advisory.
- Run API codegen after every OpenAPI change.
- Keep API reads joined to `farms.user_id`; advisory IDs alone are never sufficient for authorization.
- The Google API key path currently uses the available `gemini-3-flash-preview` model because new API users may receive a 404 for the older `gemini-2.5-flash` model.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
