# Railway Setup & GitHub Secrets

This document lists exact steps to create a Railway project, connect the repository, and configure required secrets and branch protection.

1) Create Railway project
- Sign in to https://railway.app and create a new project.
- Choose "Deploy from GitHub" and connect the repository.

2) Add services
- Add a PostgreSQL plugin (Postgres 15+) and a Redis plugin (Redis 7+).

3) Configure environment variables
In the Railway project settings, add the following environment variables (use values from your staging/production environment):

- `NODE_ENV` = production
- `APP_PORT` = 3000
- `DB_HOST` = the Railway Postgres host (provided by the plugin)
- `DB_PORT` = 5432
- `DB_USERNAME` = provided by Railway Postgres
- `DB_PASSWORD` = provided by Railway Postgres
- `DB_NAME` = opspilot_dev (or the DB name Railway provides)
- `REDIS_HOST` = the Railway Redis host
- `REDIS_PORT` = 6379
- `REDIS_PASSWORD` = (if provided)
- `OPENAI_API_KEY` = <your OpenAI key>
- `OPENAI_MODEL` = gpt-4
- `OPENAI_TEMPERATURE` = 0.7
- `SLACK_BOT_TOKEN` = <your Slack bot token>
- `SLACK_SIGNING_SECRET` = <your Slack signing secret>
- `MIN_ALERTS_TO_GROUP` = 2

4) GitHub secrets (for Actions)
Add the following repository secrets in GitHub (Settings → Secrets → Actions):

- `OPENAI_API_KEY` - same as above
- `RAILWAY_TOKEN` - optional if you use Railway CLI in CI
- `SLACK_BOT_TOKEN`
- `SLACK_SIGNING_SECRET`
- `DB_PASSWORD` (if needed by CI integration tests)

5) Branch protection suggestions
- Protect `main` branch.
- Require status checks: `build` (CI) and `test` to pass before merging.
- Require at least one approving review.
- Optional: enable `Require signed commits` and `Include administrators`.

6) Deploy method
- Option A: Railway auto-deploy from GitHub — recommended for simplicity.
- Option B: Use GitHub Actions to build and push a Docker image to GHCR, then deploy from GHCR on Railway (configure Railway to pull the image).

7) Quick test after deploy
- Send a few test messages to your Slack channel using the bot and confirm an incident is created and posted.
