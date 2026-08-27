# PulseOps - Deployment Checklist

## Goal

Deploy PulseOps without leaking secrets and keep the portfolio demo easy to
verify.

## Current Production

Production URL:

```text
https://pulseops-analytics.vercel.app
```

GitHub repository:

```text
https://github.com/aicha-btn/pulse-ops
```

Latest verified production checks:

- landing returns `200`;
- login returns `200`;
- `/app` redirects signed-out users to login;
- ingestion rejects missing API keys with `401`;
- cron rejects missing secrets with `401`;
- cron accepts `Authorization: Bearer <CRON_SECRET>` and runs aggregation.

## Before GitHub

- Initialize the Git repository if it does not exist yet.
- Confirm `.env.local` is ignored.
- Never commit Supabase URLs that include passwords.
- Never commit full ingestion API keys.
- Keep `.env.example` empty and safe.
- Run:

```bash
npm run validate
```

## Before Vercel

Create the same environment variables in Vercel:

```text
DATABASE_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
CRON_SECRET
INGESTION_RATE_LIMIT_PER_MINUTE
NEXT_PUBLIC_INGESTION_TEST_KEY
SEED_DEMO_API_KEY
```

Optional and currently unused:

```text
SUPABASE_SERVICE_ROLE_KEY
```

Only add the service role key if a future server-only admin workflow really
needs it.

## Database Setup

After Vercel variables are configured, run locally against the production
Supabase project or use a controlled migration command:

```bash
npm run db:migrate
npm run db:seed
npm run jobs:aggregate
npm run setup:smoke
```

The seed creates the demo workspace, Northstar Analytics project, realistic
companies, tracked users, events and one local ingestion key.

## Cron

`vercel.json` calls the aggregation endpoint once per day:

```text
/api/jobs/aggregate
```

The endpoint expects:

```text
Authorization: Bearer <CRON_SECRET>
```

This daily schedule is deliberate: it keeps the default deployment compatible
with Vercel Hobby.

For the intended 5-minute product rhythm on a free setup, create an external
HTTP cron job:

```text
URL: https://<deployment-url>/api/jobs/aggregate
Method: GET
Schedule: */5 * * * *
Header: Authorization: Bearer <CRON_SECRET>
```

cron-job.org is a simple option because it supports custom headers and frequent
HTTP calls.

If metrics stop refreshing, check these in order:

1. The cron job is enabled.
2. `CRON_SECRET` is set in Vercel.
3. The cron request sends `Authorization: Bearer <CRON_SECRET>`.
4. `/api/jobs/aggregate` returns `200`.

## Post-Deploy Smoke Test

1. Open `/`.
2. Open `/login`.
3. Sign in with a test account.
4. Open `/app`.
5. Confirm the current project is `Northstar Analytics`.
6. Open `/app/integration`.
7. Send a demo event.
8. Open `/app/events`.
9. Confirm the event appears as `accepted`.
10. Trigger or wait for aggregation.
11. Refresh `/app/system` and confirm readiness.

## Demo Rule

The app should always be explainable with this chain:

```text
event sent -> API validates -> PostgreSQL stores -> cron aggregates -> UI explains
```
