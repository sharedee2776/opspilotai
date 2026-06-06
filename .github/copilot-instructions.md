# OpsPilot AI - Development Instructions for Copilot

## 🎯 Project Overview

**OpsPilot AI** is an AI-powered alert intelligence platform designed to reduce alert noise by 80-90% through:
- Alert deduplication & grouping
- AI-powered root cause analysis
- Automated fix suggestions
- Safe auto-remediation

**Current Phase**: MVP (Week 1-3)
**Status**: ✅ Project structure initialized, TypeScript compiles successfully
**Build**: ✅ Successfully builds to `/dist`

---

## 🏗️ Tech Stack

- **Backend**: NestJS (Node.js + TypeScript)
- **Database**: PostgreSQL (via TypeORM)
- **Queue**: Redis + BullMQ
- **AI**: OpenAI API (GPT-4)
- **Slack Integration**: Slack Bolt
- **Deployment**: Railway/Render/Docker

---

## 📁 Project Structure

```
opspilot-ai/
├── src/
│   ├── main.ts                # Entry point
│   ├── app.module.ts          # Root NestJS module
│   ├── modules/               # Feature modules
│   ├── core/                  # Core services
│   └── common/                # Shared utilities
├── dist/                      # Compiled output
├── docker/
│   └── Dockerfile             # Production image
├── database/
│   └── migrations/            # TypeORM migrations
├── .env.example               # Environment template
├── package.json
├── tsconfig.json
├── docker-compose.yml         # Local dev stack
└── README.md
```

---

## 🚀 Quick Commands

```bash
# Development
npm run start:dev          # Start with hot reload
npm run build              # Compile TypeScript
npm run lint               # ESLint check

# Docker
docker-compose up -d       # Start services (Postgres + Redis)
docker-compose down        # Stop services

# Testing  
npm run test               # Run unit tests
```

---

## 🎯 MVP Phase 1 Deliverables (Weeks 1-3)

### ✅ Completed
- Project scaffolding
- TypeScript build setup
- NestJS app initialization
- Docker stack (Compose + Dockerfile)
- Environment configuration

### ⏳ In Progress / TODO

**Week 1-2: Alert Ingestion & Grouping**
- [ ] Create Alerts module with service/controller
- [ ] Create Incidents module for grouping
- [ ] Implement alert deduplication logic (rule-based)
- [ ] Create PostgreSQL entities (Alert, Incident, Action)
- [ ] Setup BullMQ for alert processing

**Week 2-3: Slack Integration & AI Summarization**
- [ ] Integrate Slack Bolt API
- [ ] Create AlertNormalizer service
- [ ] Implement IncidentBuilder service
- [ ] Integrate OpenAI API
- [ ] Create AI summarization prompts (Prompt #1, #3)
- [ ] Post incident summaries to Slack

**MVP Deliverable**: 
```
User posts 50 alerts to Slack → Bot groups them → Bot posts summary
"Grouped 47 alerts into 1 incident: [SERVICE] Description (CRITICAL)"
```

---

## 🔑 Key Files to Create/Modify

### Phase 1 Architecture

**Modules to Implement:**

1. **AlertsModule** (`src/modules/alerts/`)
   - `alerts.service.ts` - CRUD operations
   - `alerts.controller.ts` - API endpoints
   - `services/deduplication.service.ts` - Hash-based dedup
   - `services/alert-normalizer.service.ts` - Convert Slack/Datadog → standard format

2. **IncidentsModule** (`src/modules/incidents/`)
   - `incidents.service.ts` - Incident lifecycle
   - `incidents.controller.ts` - API endpoints
   - `services/incident-builder.service.ts` - Group alerts into incidents

3. **SlackModule** (`src/modules/slack/`)
   - `slack.service.ts` - Slack Bolt integration
   - `slack.controller.ts` - Webhook handler
   - Listens to messages, groups alerts, posts summaries

4. **AiModule** (`src/modules/ai/`)
   - `ai.service.ts` - OpenAI integration
   - Implement: Summarization (Prompt #1), Root cause (Prompt #3)

5. **Core Modules** 
   - `src/core/database/` - TypeORM setup
   - `src/core/queue/` - BullMQ configuration

**Entities** (`src/common/entities/`)
- `alert.entity.ts` - Alert table schema
- `incident.entity.ts` - Incident table schema
- `action.entity.ts` - Action table schema

---

## 📊 Database Schema (Phase 1)

### Alerts Table
```sql
- id (UUID, PK)
- title, description, service
- severity: ENUM (low, medium, high, critical)
- status: ENUM (pending, grouped, resolved)
- source: VARCHAR (slack, datadog, cloudwatch)
- dedupHash: VARCHAR (for deduplication)
- metadata: JSONB (source-specific data)
- incidentId: FK to Incident
```

### Incidents Table
```sql
- id (UUID, PK)
- title, summary, rootCause
- status: ENUM (active, investigating, resolved)
- alertCount, suggestedFixes
- slackMessageTs, slackChannelId
- alerts: relationship to Alerts[]
- actions: relationship to Actions[]
```

### Actions Table
```sql
- id (UUID, PK)
- name, type, command
- status: ENUM (suggested, approved, executing, success, failed)
- riskLevel
- incidentId: FK to Incident
```

---

## 🔌 Integration Points

### Slack
- Listen to messages in alert channel
- Extract: service, severity, description
- Post: incident summaries with "Approve fix" buttons

### OpenAI (Phase 1)
- **Prompt #1**: Summarization (title + severity + what happened)
- **Prompt #3**: Root cause analysis (logs + alerts → likely cause)

### PostgreSQL
- Store alerts, incidents, actions
- Enable historical analysis for learning

### Redis + BullMQ
- Queue alert events
- Prevent duplicate processing
- Retry failed jobs

---

## 🧪 Testing Strategy

**MVP Validation:**
1. Send 50 alerts to Slack channel
2. Verify bot groups them by service + time window
3. Verify AI generates accurate summary
4. Verify summary posts to Slack thread

**Metrics:**
- Alerts → Incidents ratio: Target 50:1
- Time to summary: <30 seconds
- AI accuracy: >80%

---

## 📝 AI Prompts (Phase 1)

**Prompt #1: Alert Summarization**
```
You are a senior DevOps engineer.
Given these alerts, summarize:
1. What is happening
2. Which service is affected
3. Severity (low, medium, high, critical)

Output JSON with: summary, service, severity
```

**Prompt #3: Root Cause Analysis**
```
You are a DevOps expert.
Based on these alerts, determine the most likely root cause.

Output JSON with: root_cause, confidence, explanation
```

---

## 🚀 Deployment Checklist

**Local Development:**
- [ ] `npm install` ✅
- [ ] `npm run build` ✅
- [ ] Set `.env` with Slack/OpenAI credentials
- [ ] `docker-compose up -d` (start Postgres + Redis)
- [ ] `npm run start:dev` (run dev server)

**Railway Deployment:**
- [ ] Connect GitHub repo
- [ ] Add PostgreSQL + Redis services
- [ ] Set environment variables
- [ ] Deploy

**Docker:**
- [ ] Build: `docker build -f docker/Dockerfile -t opspilot .`
- [ ] Run: `docker run -p 3000:3000 opspilot`

---

## 🐛 Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| TypeScript errors | Run `npm run build` to see errors |
| Database connection | Verify PostgreSQL running: `docker-compose ps` |
| Redis connection | Check Redis: `docker-compose logs redis` |
| Slack not responding | Verify `SLACK_BOT_TOKEN` in `.env` |
| OpenAI errors | Check API key: `echo $OPENAI_API_KEY` |

---

## 📚 References

- [NestJS Docs](https://docs.nestjs.com)
- [Slack Bolt Docs](https://slack.dev/bolt-js)
- [OpenAI API](https://platform.openai.com/docs)
- [Railway Docs](https://docs.railway.app)
- [TypeORM Docs](https://typeorm.io)

---

## 💡 Development Tips

1. **Always build before testing**: `npm run build`
2. **Use Docker for services**: `docker-compose up -d`
3. **Check logs**: `docker-compose logs -f app`
4. **Format code**: `npm run lint`
5. **Test locally first** before deploying to Railway

---

## 📞 Key Contacts

- **Lead**: Your Name
- **Slack Channel**: #opspilot-dev
- **Status**: Track in GitHub Projects

---

**Last Updated**: May 25, 2026
**Next Milestone**: Phase 1 MVP Complete (June 15, 2026)
