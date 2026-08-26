import { test, expect, expectRestrictedRedirect } from '../fixtures/smoke.fixtures';

/**
 * Sanitized example of the pattern behind the 62-test route-access and
 * branding gating suite. The real suite covers a specific product's
 * permission matrix; this version uses generic placeholder routes to
 * demonstrate the pattern without exposing real route names or product
 * structure.
 *
 * KEY IDEA: one test body, driven by a data table, rather than N
 * hand-copied near-duplicate tests. Each generated test still shows up
 * in the test runner with its own descriptive name - critical for
 * triage. A report that says "42 tests, 3 failed: routes A, D, and
 * K denied access" is actionable. A report that says "test 14 of 40
 * failed" is not.
 */

const RESTRICTED_ROUTES = [
  { path: '/admin-panel', reason: 'admin-only, standard accounts denied' },
  { path: '/billing-internal', reason: 'internal billing tools, standard accounts denied' },
  { path: '/team-management', reason: 'owner-only, standard accounts denied' },
];

const ALLOWED_ROUTES = ['/dashboard', '/reports', '/settings/profile'];

test.describe('Route-access gating @smoke @critical-path', () => {
  for (const { path, reason } of RESTRICTED_ROUTES) {
    test(`${path} redirects for a standard account (${reason}) @smoke`, async ({ page, mockApi }) => {
      await mockApi.mock(`**/api${path}/**`, { error: 'forbidden' }, 403);
      await expectRestrictedRedirect(page, path);
    });
  }

  for (const path of ALLOWED_ROUTES) {
    test(`${path} is reachable for a standard account @smoke`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(new RegExp(path.replace('/', '\\/')));
    });
  }

  test('branding never leaks a restricted-tier product name on an allowed page @smoke', async ({ page }) => {
    await page.goto('/dashboard');
    // Sentinel discipline: assert on a specific unique string, not a
    // generic page-title match that could be satisfied by unrelated
    // sidebar/nav content and produce a false pass.
    await expect(page.getByText('Enterprise-Only Feature Suite')).toHaveCount(0);
  });
});
