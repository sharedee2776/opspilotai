# Railway Deployment Guide

## 1. Create Railway project

- Sign in at https://railway.app → New Project → Deploy from GitHub
- Connect this repository (`OpsPilotAI`)
- Railway auto-deploys on every push to `main`

## 2. Add services in Railway

In your project dashboard, click **+ New** and add:
- **PostgreSQL** (Postgres 15+)
- **Redis** (Redis 7+)

Both will auto-provision. Railway injects their connection strings as reference variables.

## 3. Configure environment variables

In your Railway **app service** (not Postgres/Redis) → Settings → Variables, add:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
| `REDIS_URL` | `${{Redis.REDIS_URL}}` |
| `JWT_SECRET` | (generate: `openssl rand -hex 32`) |
| `JWT_EXPIRES_IN` | `7d` |
| `OPENAI_API_KEY` | `sk-...` |
| `OPENAI_MODEL` | `gpt-3.5-turbo` |
| `OPENAI_TEMPERATURE` | `0.7` |
| `SLACK_BOT_TOKEN` | `xoxb-...` |
| `SLACK_SIGNING_SECRET` | your signing secret |
| `MIN_ALERTS_TO_GROUP` | `2` |
| `ALERT_DEDUP_WINDOW_MINUTES` | `5` |
| `APP_PUBLIC_URL` | your Railway app URL |

> **Note:** Railway auto-sets `PORT`. Do not set `APP_PORT` — the app reads `PORT` automatically.

> **Note:** `DATABASE_URL` and `REDIS_URL` use Railway reference variables (`${{Postgres.DATABASE_URL}}`) which auto-resolve to the correct connection strings. Do not hard-code hostnames.

## 4. Set a default Slack channel (required for Datadog/CloudWatch webhooks)

After first deploy, call the settings endpoint so incoming webhooks know where to post:

```bash
# Get your JWT by logging in first
TOKEN=$(curl -s -X POST https://your-app.up.railway.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"yourpassword"}' | jq -r '.token')

# Set the default Slack channel ID (not name — get from channel URL)
curl -X PATCH https://your-app.up.railway.app/organizations/YOUR_ORG_ID/settings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"defaultSlackChannelId":"C0B5WTNFNF5","defaultSlackChannelName":"incidents"}'
```

## 5. Onboard a new client

1. Create their organization via `POST /organizations` (or via your own account)
2. Create a user + invite them as `member` via `POST /organizations/:id/members`
3. Create a Datadog or CloudWatch integration via `POST /integrations` — get back the webhook URL + secret
4. Give the client the webhook URL + secret to configure in their Datadog/CloudWatch
5. Set a `defaultSlackChannelId` for their org

## 6. GitHub Actions (CI)

Add these repository secrets in GitHub → Settings → Secrets → Actions:

- `OPENAI_API_KEY`
- `SLACK_BOT_TOKEN`
- `SLACK_SIGNING_SECRET`

## 7. Quick smoke test after deploy

```bash
curl https://your-app.up.railway.app/health
# Expected: {"status":"ok","checks":{"database":"ok","redis":"ok"}}
```

## 8. Slack bot required OAuth scopes

| Scope | Purpose |
|---|---|
| `chat:write` | Post incident notifications |
| `app_mentions:read` | Receive @mentions |
| `channels:history` | Read channel messages |

Event subscriptions URL: `https://your-app.up.railway.app/slack/events`
