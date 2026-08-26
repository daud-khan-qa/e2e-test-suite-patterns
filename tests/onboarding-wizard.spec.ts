import { test, expect } from '../fixtures/smoke.fixtures';

/**
 * Sanitized example of the pattern behind the 29-test onboarding suite,
 * and a real example of the test.fixme-with-a-tracked-ticket discipline
 * from the pre-merge checklist (see docs/pre-merge-checklist.md).
 */

test.describe('Onboarding wizard @smoke @critical-path', () => {
  test('step 1: creating a workspace advances to step 2 @smoke', async ({ page, mockApi }) => {
    await mockApi.mock('**/api/workspaces', { id: 'ws_demo', name: 'Demo Workspace' }, 201);

    await page.goto('/onboarding');
    await page.getByLabel('Workspace name').fill('Demo Workspace');
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page.getByRole('heading', { name: 'Invite your team' })).toBeVisible();
  });

  test('step 2: skipping team invites still advances to the final step @smoke', async ({ page }) => {
    await page.goto('/onboarding?step=2');
    await page.getByRole('button', { name: 'Skip for now' }).click();

    await expect(page.getByRole('heading', { name: 'Get Started' })).toBeVisible();
  });

  test('final step: "Get Started" completes onboarding and leaves the wizard @smoke', async ({
    page,
    mockApi,
  }) => {
    await mockApi.mock('**/api/onboarding/complete', { redirect: '/dashboard' }, 200);

    await page.goto('/onboarding?step=3');
    await page.getByRole('button', { name: 'Get Started' }).click();

    await page.waitForURL('**/dashboard');
  });

  // Real defect discipline example: this test is disabled because of a
  // genuine, tracked product gap - not silently skipped. A silent skip
  // is how coverage rots invisibly; a fixme with a ticket ID is a paper
  // trail that survives the person who wrote it leaving the team.
  test.fixme(
    'browser back-button during step 2 preserves step 1 form data (DEMO-142, open)',
    async ({ page }) => {
      await page.goto('/onboarding');
      await page.getByLabel('Workspace name').fill('Demo Workspace');
      await page.getByRole('button', { name: 'Continue' }).click();
      await page.goBack();
      await expect(page.getByLabel('Workspace name')).toHaveValue('Demo Workspace');
    }
  );
});
