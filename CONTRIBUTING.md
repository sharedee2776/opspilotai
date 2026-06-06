# Contributing

Thanks for contributing to OpsTrainAI. Please follow these guidelines to keep the repository healthy and reviewable.

Code style
- Use TypeScript and follow existing patterns in `src/`.
- Run lint and tests before opening a PR:

```bash
npm run lint
npm test -- --runInBand
```

Branching and PRs
- Create feature branches from `main`: `feature/short-desc`.
- Open a PR against `main` with a clear description and linked issue if available.
- Keep PRs focused and small; prefer multiple small PRs to one large PR.

Commit messages
- Use conventional commits where possible. Examples:
  - `feat: add incident grouping endpoint`
  - `fix: correct deduplication hash logic`
  - `chore: update dependencies`

Review checklist for PRs
- Build passes locally: `npm run build`.
- Linting fixed: `npm run lint`.
- Tests pass: `npm test`.
- No secrets or API keys in the diff.

Testing
- Unit tests are under `src/**/*.spec.ts` and run with `npm test`.
- For integration/E2E tests (optional), run services via `docker-compose up -d`.

Security
- Never commit `.env` or credentials. Use GitHub Secrets for CI/CD.

Thank you for improving OpsTrainAI!
