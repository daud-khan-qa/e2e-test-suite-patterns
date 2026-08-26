/**
 * Minimal static/dynamic fixture server for the demo app under test.
 *
 * This exists so the tests in this repo can actually execute and pass
 * end-to-end in CI, not just have their config statically validated.
 * No framework, no build step - plain Node http, deliberately simple
 * since its only job is to give the Playwright tests something real
 * to click through.
 */

const http = require('http');

const PORT = process.env.PORT || 4173;

const RESTRICTED_ROUTES = ['/admin-panel', '/billing-internal', '/team-management'];

function page(body) {
  return `<!doctype html><html><body>${body}</body></html>`;
}

function dashboardPage() {
  return page(`<h1>Dashboard</h1><p>Welcome to your demo workspace.</p>`);
}

function reportsPage() {
  return page(`<h1>Reports</h1>`);
}

function profilePage() {
  return page(`<h1>Profile Settings</h1>`);
}

function restrictedShell(routePath) {
  return page(`
    <h1>Checking access...</h1>
    <script>
      fetch('/api${routePath}/check')
        .then(function (r) { if (!r.ok) { window.location.href = '/dashboard'; } })
        .catch(function () { window.location.href = '/dashboard'; });
    </script>
  `);
}

function onboardingStep1() {
  return page(`
    <h1>Create your workspace</h1>
    <label for="wsname">Workspace name</label>
    <input id="wsname" />
    <button id="cont">Continue</button>
    <script>
      document.getElementById('cont').addEventListener('click', function () {
        var name = document.getElementById('wsname').value;
        fetch('/api/workspaces', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name }),
        }).then(function () {
          window.location.href = '/onboarding?step=2';
        });
      });
    </script>
  `);
}

function onboardingStep2() {
  return page(`
    <h1>Invite your team</h1>
    <button onclick="window.location.href='/onboarding?step=3'">Skip for now</button>
  `);
}

function onboardingStep3() {
  return page(`
    <h1>Get Started</h1>
    <button id="go">Get Started</button>
    <script>
      document.getElementById('go').addEventListener('click', function () {
        fetch('/api/onboarding/complete', { method: 'POST' })
          .then(function (r) { return r.json(); })
          .then(function (d) { window.location.href = d.redirect || '/dashboard'; });
      });
    </script>
  `);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const routePath = url.pathname;

  let body;
  let status = 200;

  if (routePath === '/dashboard') body = dashboardPage();
  else if (routePath === '/reports') body = reportsPage();
  else if (routePath === '/settings/profile') body = profilePage();
  else if (RESTRICTED_ROUTES.includes(routePath)) body = restrictedShell(routePath);
  else if (routePath === '/onboarding') {
    const step = url.searchParams.get('step');
    body = step === '2' ? onboardingStep2() : step === '3' ? onboardingStep3() : onboardingStep1();
  } else {
    status = 404;
    body = page('<h1>Not found</h1>');
  }

  res.writeHead(status, { 'Content-Type': 'text/html' });
  res.end(body);
});

server.listen(PORT, () => {
  console.log(`Fixture server listening on http://localhost:${PORT}`);
});

module.exports = server;
