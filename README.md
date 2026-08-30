# E2E Test Suite Patterns

[![CI](https://github.com/daud-khan-qa/e2e-test-suite-patterns/actions/workflows/ci.yml/badge.svg)](https://github.com/daud-khan-qa/e2e-test-suite-patterns/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Playwright](https://img.shields.io/badge/tested%20with-Playwright-2EAD33.svg)](https://playwright.dev)

Sanitized reference implementation of the patterns behind 438 Playwright E2E test cases I personally authored and merged into a production SaaS codebase across 6 product modules.

## Test coverage by module

| Module | Test cases |
| --- | --- |
| Site Explorer | 194 |
| Keyword tools | 68 |
| Route-access & branding gating | 62 |
| Backlinks | 38 |
| Onboarding | 29 |
| Billing | 47 |
| **Total** | **438** |

Counted directly from the codebase with `npx playwright test --list`, which correctly resolves data-driven tests (a single loop over a route array can generate dozens of real test instances that a plain source-code search would undercount).

## Why these patterns, specifically

### 1. Data-driven test generation over copy-paste
Route-access rules, permission matrices, and per-item CRUD checks are naturally repetitive - the wrong move is copy-pasting a near-identical test per route. `tests/route-access-gating.spec.ts` shows the pattern instead: one test body, driven by a data array, with each generated test still getting its own readable name in the runner output. That matters for triage - a failure needs to say *which* route broke, not "test 14 of 40 failed."

### 2. Hermetic tests, not live-credential tests
Every test here runs against mocked auth state and intercepted API routes (`fixtures/smoke.fixtures.ts`) - no real account, no real backend, no secrets to manage. That's what makes a suite safe to run in CI on every PR rather than only manually against a shared account. The billing and route-gating suites in the real codebase both follow this pattern.

### 3. `test.fixme` with a tracked ticket, never a silent skip
When a test can't pass because of a genuine product gap (not a test bug), it's marked `fixme` with a comment pointing at a real tracked ticket ID - see `tests/onboarding-wizard.spec.ts`. A silent `test.skip` with no explanation is how coverage quietly rots; a fixme with a ticket ID is a paper trail that survives the person who wrote it leaving the team.

### 4. The pre-merge checklist (`docs/pre-merge-checklist.md`)
Every one of the 438 tests went through the same checklist before merge: pipeline verified green job-by-job, no arbitrary `waitForTimeout` calls, a co-located unit test for any non-test source file touched, whitespace-clean diffs, and no `test.only` left behind.

## How a test run actually executes

This repo is unusual among sanitized reference suites: it doesn't just validate its own config, it runs against a real, self-contained local app and produces genuine pass/fail results. This diagram is traced directly against `run-tests.js`, `fixture-server/server.js`, and `fixtures/smoke.fixtures.ts` - not an idealized version.

```mermaid
flowchart TD
    A["npm test -> run-tests.js"] --> B["spawn fixture-server/server.js"]
    B --> C["waitForServer: poll http://localhost until 200"]
    C --> D["spawn npx playwright test"]

    D --> E["smoke.fixtures.ts: fake auth<br/>injected into localStorage"]
    D --> F["smoke.fixtures.ts: mockApi intercepts<br/>baseline /api/* routes"]
    E --> G["Test navigates to a fixture-server route"]
    F --> G

    G --> H{"Is the route in<br/>RESTRICTED_ROUTES?"}
    H -->|yes - one generated test per route| I["Server serves a loading shell,<br/>fetches /check, gets mocked 403,<br/>redirects to /dashboard"]
    H -->|no - one generated test per route| J["Server serves the real<br/>page directly"]

    I --> K["expectRestrictedRedirect asserts<br/>the final settled URL"]
    J --> L["Assert page reachable,<br/>no restricted branding text present"]

    K --> M["Playwright process exit code"]
    L --> M
    M --> N["run-tests.js kills fixture-server,<br/>propagates the real exit code"]
```

The two branches under `H` are what `test_route-access-gating.spec.ts`'s two `for` loops actually generate - `RESTRICTED_ROUTES` and `ALLOWED_ROUTES` each produce one real, independently-named test per entry, which is the data-driven pattern from point 1 above shown as an actual runtime path, not just described.

## Running it yourself

```bash
npm install
npx playwright install chromium
npm test
```

## Structure

```
fixtures/
  smoke.fixtures.ts        Hermetic base fixture: mocked auth + API interception
fixture-server/
  server.js                Minimal local app the tests run against
tests/
  route-access-gating.spec.ts   Data-driven test generation over a route matrix
  onboarding-wizard.spec.ts     Multi-step flow + a real test.fixme-with-ticket example
docs/
  pre-merge-checklist.md   The checklist every merged test satisfied
```

## Relationship to my other repos

- [`agentic-safety-patterns`](https://github.com/daud-khan-qa/agentic-safety-patterns) - the AI-agent safety-engineering side of the work (precision gating, fail-closed invariants)
- [`playwright-billing-qa-suite`](https://github.com/daud-khan-qa/playwright-billing-qa-suite) - the billing-specific patterns (dynamic button labels, Stripe soft-checks)
- [`ai-agentic-qa-framework`](https://github.com/daud-khan-qa/ai-agentic-qa-framework) - the AI-agent-driven QA side of the work (browser automation, hydration reliability)
- This repo is the disciplined, peer-reviewed, hand-authored E2E work the others build on top of.

---
Sanitized reference implementation - module names, routes, and business-specific copy are generalized placeholders. Test counts and the review discipline described reflect real production work.
