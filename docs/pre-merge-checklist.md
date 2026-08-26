# Pre-Merge Checklist

The actual checklist every one of the 438 test cases in this work went through before merge — not an aspirational list, the real one used in code review.

## Before requesting review

- [ ] **Pipeline is green job-by-job, not just the overall badge.** A sharded CI run can have one shard silently skipped or short-circuited while the top-level status still shows green. Pull the raw job list and confirm every shard actually ran and passed — don't trust the summary badge alone.
- [ ] **No `test.only` left in the diff.** Trivial to miss, catastrophic if it ships — it silently disables every other test in the file in CI.
- [ ] **No arbitrary `waitForTimeout()` calls.** Every wait is tied to a real condition (`waitForURL`, `waitForResponse`, an element becoming visible) — a fixed sleep is either too short (flaky) or too long (slow for no reason), and it never explains *what* it's actually waiting for to a future reader.
- [ ] **Every changed non-test source file has a co-located unit test in the same commit.** E2E coverage does not substitute for unit coverage on the underlying change — a change-detection gate that only checks "was this file touched" should fail closed if no unit test moved with it.
- [ ] **Diff is whitespace-clean.** `git diff --check` against the target branch — trivial to verify, easy to forget, and it pollutes the review with noise unrelated to the actual change.
- [ ] **Every `test.fixme` has a real ticket ID in the test name or a comment**, and that ticket actually exists and describes the real gap. An untracked fixme is functionally the same as a silent skip — it just delays discovery.
- [ ] **No hardcoded dates or `new Date()` in assertions.** A UTC-midnight boundary check that passes in one timezone can fail for a teammate or a CI runner in another. Pin a timezone explicitly, or use a fixed reference time.
- [ ] **Locators target the specific element, not the first match.** `getByRole('heading', { name })` over `getByText(...).first()` — a page that renders the same label in a nav item *and* the main content will let `.first()` pass even if the real content is broken, because it's matching the wrong occurrence.
- [ ] **Assertions use unique, injected sentinel values** where the page under test could otherwise be satisfied by unrelated cached or default content — e.g. assert against a value your mock specifically injected (`"sentinel-project-004"`), not a generic string that could appear anywhere on the page.

## What this catches in practice

Applying this checklist (and a deliberate adversarial pass looking for ways each assertion *could* be wrong) surfaced real issues before merge that a less careful review would have shipped as passing tests: assertions that passed against stale cached list data before the real detail fetch resolved, a locator that silently matched a sidebar nav link instead of the actual page heading it was meant to verify, and a date assertion that would have been flaky specifically for engineers outside a UTC-negative timezone.

None of these would have failed CI on the day they were written — they'd have shipped as green, and only failed later, intermittently, for the wrong reason. That gap between "passes today" and "actually verifies the right thing" is what this checklist exists to close.
