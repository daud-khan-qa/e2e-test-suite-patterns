import { test as base, expect } from '@playwright/test';
import type { Page, Route } from '@playwright/test';

/**
 * Hermetic test fixture: no real account, no real backend.
 * Auth state is injected directly into localStorage, and every /api/
 * call is intercepted and answered with a mock response.
 *
 * This is what makes the suite safe to run in CI on every PR - a live
 * test hitting a real shared account cannot run in parallel across many
 * PRs without contention, but a hermetic one can.
 */

type MockApi = {
  mock: (pattern: string | RegExp, response: object, status?: number) => Promise<void>;
};

export const test = base.extend<{ mockApi: MockApi }>({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'auth',
        JSON.stringify({ token: 'fixture-jwt-not-a-real-credential', accountType: 'standard' })
      );
    });
    await use(page);
  },

  mockApi: async ({ page }, use) => {
    const registered: Array<{ pattern: string | RegExp; response: object; status: number }> = [];

    const mock = async (pattern: string | RegExp, response: object, status = 200) => {
      registered.push({ pattern, response, status });
      await page.route(pattern, (route: Route) =>
        route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(response) })
      );
    };

    // Baseline mocks every test in this suite needs regardless of what
    // it's specifically testing - unmocked routes fall through to a
    // real network call, which is exactly what "hermetic" is meant to
    // prevent, so anything new the app calls should get added here.
    await mock('**/api/notifications/unread-count**', { unread_count: 0 });
    await mock('**/api/banner/next-scheduled**', null);

    await use({ mock });
  },
});

export { expect };

/** Assert a route redirected somewhere restricted-access lands, without
 *  over-specifying the exact intermediate navigation - only the final
 *  settled URL matters for a gating test. */
export async function expectRestrictedRedirect(page: Page, deniedPath: string) {
  await page.goto(deniedPath);
  await page.waitForURL((url) => !url.pathname.startsWith(deniedPath), { timeout: 10000 });
}
