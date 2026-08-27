# PulseOps

PulseOps is a fullstack product analytics and account health SaaS for small B2B
teams. It receives product events, stores them in PostgreSQL, aggregates them,
then turns the stream into readable activation, activity and account-health
signals.

The project is built as a portfolio piece to show a complete data product:

```text
event -> validation -> storage -> aggregation -> visualization -> decision
```

## What It Demonstrates

- fullstack Next.js with TypeScript strict mode;
- Supabase PostgreSQL and Supabase Auth;
- Drizzle schema, migrations and typed database access;
- secure ingestion API with hashed project API keys;
- event payload validation with Zod;
- PostgreSQL-backed rate limiting per API key;
- idempotent event storage through stable `event_id` values;
- aggregation jobs for activity, activation funnel and account health;
- cron-ready aggregation endpoint secured with `CRON_SECRET`;
- product dashboards with a custom Signal Observatory visual direction;
- developer-oriented integration docs and live ingestion tester;
- realistic demo dataset for a B2B SaaS telemetry story.

## Product Scope

PulseOps helps a small B2B team answer:

1. Is the product active?
2. Where does activation drop?
3. Which accounts are healthy, weakening or silent?
4. Did a product event actually arrive and get stored?
5. Which signal should the team act on next?

The MVP includes:

- projects;
- API key creation and revocation;
- `POST /api/ingest/track`;
- workspaces and signed-in users;
- companies, tracked users and events;
- event stream with accepted, ignored and rejected entries;
- activation funnel;
- activity over time;
- transparent account health score;
- inactive account queue;
- project settings;
- Supabase readiness page;
- integration documentation and live tester.

## Visual Direction

The app uses a direction called:

```text
Signal Observatory / Product Telemetry Control Room
```

The interface should feel like a professional SaaS product that listens to a
living product stream. It avoids cyberpunk, generic CRM cards and decorative
data visuals. Charts, event timelines and health states are designed to make the
underlying telemetry easier to understand.

Reusable product primitives live in:

```text
src/components/app/pulse-primitives.tsx
```

## Stack

- Next.js 16 fullstack app;
- React 19;
- TypeScript strict;
- Supabase PostgreSQL;
- Supabase Auth;
- Drizzle ORM;
- Recharts;
- Zod;
- Vercel Cron;
- GitHub Actions-ready npm scripts.

## Local Development

Install dependencies:

```bash
npm install
```

Start the local server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

The product app is available at:

```text
http://localhost:3000/app
```

When Supabase Auth is configured, signed-out users are redirected to:

```text
http://localhost:3000/login
```

## Environment Variables

Copy the example file:

```bash
cp .env.example .env.local
```

Required for real local data:

```text
DATABASE_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
CRON_SECRET
INGESTION_RATE_LIMIT_PER_MINUTE
```

Useful for local demos:

```text
NEXT_PUBLIC_INGESTION_TEST_KEY
SEED_DEMO_API_KEY
```

Never commit `.env.local`. It contains database URLs and API keys.

Full setup notes are in:

```text
SUPABASE_SETUP.md
```

## Database Setup

Run migrations:

```bash
npm run db:migrate
```

Seed the demo dataset:

```bash
npm run db:seed
```

The deterministic seed creates:

- 1 demo workspace;
- 1 demo project;
- 8 companies;
- 16 tracked users;
- 851 product events;
- 1 local ingestion API key.

After manual ingestion tests, the local event count can be higher.

Run the first aggregation:

```bash
npm run jobs:aggregate
```

Verify the real database:

```bash
npm run setup:smoke
```

## Ingestion API

Endpoint:

```text
POST /api/ingest/track
Authorization: Bearer <project_api_key>
```

Example payload:

```json
{
  "event_id": "evt_123",
  "event": "first_event_sent",
  "occurred_at": "2026-08-27T12:30:00.000Z",
  "user": {
    "external_id": "user_42",
    "email": "founder@example.com",
    "name": "Aicha"
  },
  "company": {
    "external_id": "company_9",
    "name": "Northstar Labs"
  },
  "properties": {
    "source": "onboarding"
  }
}
```

Accepted events are stored in `events`. Duplicate `event_id` values are ignored
instead of counted twice. Invalid payloads are recorded in the ingestion log when
a valid API key identifies the project.

## Aggregations

The aggregation job recalculates:

- daily activity;
- activation funnel progress;
- account health snapshots;
- aggregation run status.

Local command:

```bash
npm run jobs:aggregate
```

HTTP endpoint:

```text
GET /api/jobs/aggregate
POST /api/jobs/aggregate
Authorization: Bearer <CRON_SECRET>
```

The endpoint accepts both `GET` and `POST`, so it can be called by Vercel Cron or
another HTTP cron service.

`vercel.json` keeps a daily fallback schedule that is compatible with Vercel
Hobby. For the intended 5-minute product rhythm on a free setup, configure an
external HTTP cron such as cron-job.org to call the same endpoint every 5 minutes
with:

```text
Authorization: Bearer <CRON_SECRET>
```

## Validation

General validation:

```bash
npm run validate
```

Real-data validation with Supabase configured:

```bash
npm run validate:real
```

Individual checks:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run setup:check:strict
npm run setup:smoke
```

## Demo Flow

1. Open `/`.
2. Open `/login` and sign in.
3. Open `/app` and show Northstar Analytics.
4. Open `/app/integration`.
5. Send a demo event.
6. Open `/app/events` and show the accepted event.
7. Run `npm run jobs:aggregate`.
8. Refresh `/app` to show the recalculated metrics.

The detailed presentation script is in:

```text
PULSEOPS_DEMO_SCRIPT.md
```

## Documentation

- `PRODUCT_BRIEF.md` - product scope and decisions;
- `ARCHITECTURE.md` - technical architecture;
- `DESIGN_SYSTEM.md` - visual identity and design system;
- `PLAN_PULSEOPS.md` - implementation plan;
- `AGGREGATIONS.md` - metric calculations;
- `DATASET.md` - realistic demo data;
- `SUPABASE_SETUP.md` - real data setup;
- `PULSEOPS_HANDOFF.md` - current state and handoff notes.
