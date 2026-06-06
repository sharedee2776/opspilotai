# OpsPilot AI 🤖

**AI Alert Intelligence + Auto-Remediation Platform**

Reduce alert noise by 80-90% through intelligent deduplication, grouping, and AI-powered root cause analysis.

## 📋 Quick Links

- **Phase**: MVP (Week 1-3)
- **Status**: ✅ Project structure initialized
- **Build**: ✅ TypeScript compiles successfully
- **Tech**: NestJS + TypeScript + PostgreSQL + Redis + OpenAI

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 15+ (optional - use Docker)
- Redis 7+ (optional - use Docker)

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env
# Edit .env with your credentials

# 3. Build project
npm run build

# 4. Start development server
npm run start:dev
```

Server will run on `http://localhost:3000`

---

## 🐳 Docker Setup (Recommended for Development)

```bash
# Start all services (PostgreSQL + Redis + App)
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

---

## 📂 Project Structure

```
opspilot-ai/
├── src/
│   ├── main.ts              # Entry point
│   ├── app.module.ts        # Root NestJS module
│   ├── modules/             # Feature modules (Phase 2+)
│   │   ├── alerts/
│   │   ├── incidents/
│   │   ├── slack/
│   │   └── ai/
│   ├── core/                # Core utilities
│   │   ├── database/
│   │   ├── queue/
│   │   └── config/
│   └── common/              # Shared
│       ├── entities/
│       ├── dto/
│       └── decorators/
├── database/
│   └── migrations/          # TypeORM migrations
├── docker-compose.yml       # Local development stack
├── Dockerfile               # Production image
├── tsconfig.json            # TypeScript config
├── package.json
└── README.md
```

---

## 📖 Architecture Overview

### Phase 1: MVP (Weeks 1-3) ✅ In Progress
**Goal:** Prove alert noise reduction works

**Components:**
- ✅ Project structure & build setup
- ⏳ Slack alert ingestion
- ⏳ Alert deduplication (rule-based)
- ⏳ Incident grouping
- ⏳ AI summarization

**Deliverable:** Slack bot turns 50 alerts → 1 summarized incident

### Phase 2: Intelligence (Weeks 4-6) 📋 Planned
- Root cause analysis
- Fix suggestions
- Risk assessment
- Learning feedback loop

### Phase 3: Action (Weeks 7-9) 🔮 Planned
- Safe auto-execution
- Kubernetes/AWS integration
- Rollback capability

### Phase 4: Market (Weeks 10-12) 🚀 Planned
- Multi-team support
- Datadog/CloudWatch integration
- First paying customers

---

## 🛠️ Development Commands

```bash
# Development
npm run start:dev          # Watch mode with hot reload
npm run build              # Compile TypeScript
npm run start              # Run production build
npm run start:prod         # Run compiled code

# Quality
npm run lint               # ESLint check & fix
npm run format             # Prettier format

# Testing
npm run test              # Run unit tests
npm run test:watch        # Watch mode
npm run test:cov          # Coverage report

# Database
npm run migration:generate # Create migration
npm run migration:run      # Apply migrations
npm run migration:revert   # Rollback migration
```

---

## 🔑 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | `development` or `production` |
| `APP_PORT` | Yes | Port to run app (default: 3000) |
| `DB_HOST` | Yes | PostgreSQL host |
| `DB_USERNAME` | Yes | Database user |
| `DB_PASSWORD` | Yes | Database password |
| `REDIS_HOST` | Yes | Redis host |
| `SLACK_BOT_TOKEN` | Yes (Phase 1+) | Slack bot token |
| `SLACK_SIGNING_SECRET` | Yes (Phase 1+) | Slack webhook secret |
| `OPENAI_API_KEY` | Yes (Phase 1+) | OpenAI API key |

---

## 📊 Key Metrics (North Star)

| Metric | Phase 1 Target | Phase 2 Target | Phase 3+ Target |
|--------|---|---|---|
| Alerts → Incidents | 50:1 | 100:1 | 150:1+ |
| Time to Resolution | 30 min | 10 min | <5 min |
| False Positive Rate | <20% | <10% | <5% |
| LLM Cost/Incident | <$1.00 | <$0.50 | <$0.25 |

---

## 🚀 Deployment

### Railway (Recommended)

1. Create a Railway project and connect your GitHub repository (or deploy from a container image).
2. Add PostgreSQL and Redis plugins inside the Railway project.
3. In Railway project settings, add the environment variables listed above (`OPENAI_API_KEY`, `SLACK_BOT_TOKEN`, etc.).
4. Enable automatic deploys from the `main` branch (recommended) or deploy manually from the Railway dashboard.

Quick Railway CLI steps (optional):

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login using an API token (create one in Railway and set it as RAILWAY_TOKEN)
railway login --apiKey $RAILWAY_TOKEN

# Deploy (from repo root)
railway up
```

CI/CD notes:

- We include a GitHub Actions CI workflow that runs build, lint, and tests on PRs and pushes (`.github/workflows/ci.yml`).
- A CD workflow (`.github/workflows/cd.yml`) builds a Docker image and pushes it to GitHub Container Registry (GHCR). You can connect Railway to deploy directly from the repository or from the container image pushed to GHCR.

### Render

1. Create web service from GitHub
2. Add PostgreSQL + Redis add-ons  
3. Set environment variables
4. Deploy

### Docker

```bash
docker build -f docker/Dockerfile -t opspilot .
docker run -p 3000:3000 opspilot
```

---

## 🔍 Testing Locally

### Test Alert Ingestion

```bash
# Start the server
npm run start:dev

# In another terminal, send a test alert
curl -X POST http://localhost:3000/alerts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "[API_SERVICE] High latency detected",
    "service": "api_service",
    "severity": "high"
  }'
```

---

## 📚 Documentation

- [API Endpoints](./docs/api.md) - Coming in Phase 2
- [Database Schema](./docs/schema.md) - Coming in Phase 2
- [Slack Integration](./docs/slack.md) - Coming in Phase 1
- [AI Prompts](./docs/prompts.md) - Coming in Phase 1

---

## 🐛 Troubleshooting

### Build Fails
```bash
# Clear cache and rebuild
rm -rf dist node_modules
npm install
npm run build
```

### Port Already in Use
```bash
# Use different port
APP_PORT=3001 npm run start:dev
```

### Database Connection Error
```bash
# Verify PostgreSQL is running
docker-compose ps
docker-compose logs postgres
```

---

## 📝 Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes in `src/modules/`
3. Run lint & tests: `npm run lint && npm run test`
4. Commit: `git commit -m "feat: description"`
5. Push & create PR

---

## 📞 Support

- **Issues**: GitHub Issues
- **Questions**: Create a Discussion
- **Email**: team@opspilot.ai

---

## 📄 License

MIT

---

## 🎯 Next Steps

- [ ] Setup Slack app & get bot token
- [ ] Configure OpenAI API key
- [ ] Run `npm run start:dev` locally
- [ ] Test alert ingestion endpoint
- [ ] Deploy to Railway/Render
- [ ] Build Phase 2: Root cause analysis

**Start date**: May 25, 2026
**Target MVP completion**: June 15, 2026
