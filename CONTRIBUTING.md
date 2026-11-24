# Contributing

Thank you for contributing to this Next.js static website. This project uses GitLab CI/CD and Jest for tests.

## How to contribute
- Create an issue or merge request (MR) with a clear description of the change.
- Follow the project's existing coding style and testing practices.

## Local development
Prerequisites: Node.js and npm.

Install dependencies
npm ci

Run the development server
npm run dev

Preview locally in your browser at
http://localhost:3000

## Testing
- Run unit tests
npm test

## Linting and type checks
- Lint
npm run lint
- Type checks (if configured)
npm run type-check

## Git workflow
- Create a feature branch: git checkout -b feat/your-feature
- Commit messages: use conventional prefixes (feat:, fix:, docs:, etc.)
- Push and open a Merge Request in GitLab
- Ensure CI pipelines pass locally before pushing

## CI/CD
- This repository uses .gitlab-ci.yml. Pipelines run automatically on MRs and pushes.
- If CI fails, run tests/lints locally to reproduce failures and fix them.

## Accessibility and documentation
- Aim for accessible markup and semantic HTML.
- Update documentation or README when introducing user-facing changes.

## Getting help
- If unsure how to proceed, open an issue describing the problem or idea.
