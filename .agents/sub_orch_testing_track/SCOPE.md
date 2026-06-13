# Scope: E2E Testing Track

## Architecture
We are testing a Next.js web application with a Supabase backend.
The test suite will exercise the application from the outside (opaque-box testing) by interacting with the UI pages (both public events directory and the private admin dashboard).
Since we are using Playwright or a Node.js-based test runner, we will launch the Next.js app in dev or production mode and point our tests to it.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|---|---|---|---|
| 1 | Create Test Infrastructure | Define features, tiers, and write `TEST_INFRA.md` at root | None | DONE |
| 2 | Set Up Test Runner & Env | Spawn worker to set up runner framework (Playwright/Node tsx runner) and seed script | M1 | PLANNED |
| 3 | Implement Tiers 1-4 | Spawn worker to implement test cases covering Tier 1 to 4 | M2 | PLANNED |
| 4 | Run & Verify E2E Tests | Run test runner against local dev/prod server, verify all tests pass | M3 | PLANNED |
| 5 | Publish TEST_READY.md | Create and write final `TEST_READY.md` at project root | M4 | PLANNED |

## Interface Contracts
- **Test Runner API**: Command `npm run test:e2e` (or equivalent) must run the full suite.
- **Environment variables**: Needs to read from `.env.local` or equivalent configuration.
