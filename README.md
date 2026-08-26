# E2E Test Suite Patterns

Sanitized reference implementation of the patterns behind 438 Playwright E2E test cases I personally authored and merged into a production SaaS codebase across 6 product modules — verified directly against the repository's own test collector and commit history, not estimated.

## Verified numbers (methodology below, not a claim taken on faith)

| Module | Test cases |
| --- | --- |
| Site Explorer | 194 |
| Keyword tools | 68 |
| Route-access & branding gating | 62 |
| Backlinks | 38 |
| Onboarding | 29 |
| Billing | 47 |
| **Total** | **438** |

**How these were counted:** the live modules were counted with `npx playwright test --list --project=<project>`, which resolves loop-generated tests (a single `.forEach(route => test(...))` block can produce dozens of real test instances that a plain text search on the source file would undercount). The billing count came from the original authoring commit's diff, since that suite was later migrated into the team's hermetic-test standard by another engineer and no longer shows my name in a simple `git blame` — the commit history still does. Never trust a headline test-count number without checking whether it was collected this way or just grepped from source.

## Why these patterns, specifically

### 1. Data-driven test generation over copy-paste
Route-access rules, permission matrices, and per-item CRUD checks are naturally repetitive — the wrong move is copy-pasting a near-identical test per route. `tests/route-access-gating.spec.ts` shows the pattern instead: one test body, driven by a data array, with each generated test still getting its own readable name in the runner output (critical for triage — a failure needs to say *which* route broke, not "test 14 of 40 failed").

### 2. Hermetic tests, not live-credential tests
Every test here runs against mocked auth state and intercepted API routes (`fixtures/smoke.fixtures.ts`) — no real account, no real backend, no secrets to manage. This is what makes a suite safe to run in CI on every PR rather than only manually against a shared account. The billing and route-gating suites in the real codebase both follow this pattern.

### 3. `test.fixme` with a tracked ticket, never a silent skip
When a test can't pass because of a genuine product gap (not a test bug), it's marked `fixme` with a comment pointing at a real tracked ticket ID — see `tests/onboarding-wizard.spec.ts`. A silent `test.skip` with no explanation is how coverage quietly rots; a fixme with a ticket ID is a paper trail that survives the person who wrote it leaving the team.

### 4. The pre-merge checklist (`docs/pre-merge-checklist.md`)
Every one of the 438 tests went through the same checklist before merge: green pipeline verified job-by-job (not just the overall badge — a shard can be silently skipped and still show green), no arbitrary `waitForTimeout` calls, a co-located unit test for any non-test source file touched, whitespace-clean diffs, and no `test.only` left behind. This is the actual discipline, not an aspirational one — documented here as the real checklist used.

## Structure

```
fixtures/
  smoke.fixtures.ts        Hermetic base fixture: mocked auth + API interception
tests/
  route-access-gating.spec.ts   Data-driven test generation over a route matrix
  onboarding-wizard.spec.ts     Multi-step flow + a real test.fixme-with-ticket example
docs/
  pre-merge-checklist.md   The actual checklist every merged test satisfied
```

## Relationship to my other repos

- [`playwright-billing-qa-suite`](https://github.com/daud-khan-qa/playwright-billing-qa-suite) — the billing-specific patterns (dynamic button labels, Stripe soft-checks)
- [`ai-agentic-qa-framework`](https://github.com/daud-khan-qa/ai-agentic-qa-framework) — the AI-agent-driven QA side of the work (browser automation, hydration reliability)
- This repo is the third leg: the disciplined, peer-reviewed, hand-authored E2E work that the other two build on top of.

---
Sanitized reference implementation — module names, routes, and business-specific copy are generalized placeholders. Test counts and the review discipline described are real, verified as described above.
