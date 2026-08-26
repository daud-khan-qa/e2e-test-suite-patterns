/**
 * Starts the fixture server, waits until it's actually answering
 * requests, runs the Playwright suite, then tears the server down and
 * exits with Playwright's own exit code.
 *
 * Written as a small standalone script instead of pulling in a
 * start-server-and-test-style dependency - one less thing that can
 * break on a platform it wasn't tested against, and it's ~40 lines.
 */

const { spawn } = require('child_process');
const http = require('http');

const PORT = process.env.PORT || 4173;
const URL = `http://localhost:${PORT}`;

function waitForServer(url, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    (function poll() {
      http
        .get(url, (res) => {
          res.resume();
          resolve();
        })
        .on('error', () => {
          if (Date.now() > deadline) {
            reject(new Error(`Fixture server did not respond within ${timeoutMs}ms`));
          } else {
            setTimeout(poll, 300);
          }
        });
    })();
  });
}

async function main() {
  const server = spawn('node', ['fixture-server/server.js'], { stdio: 'inherit' });

  try {
    await waitForServer(URL);
  } catch (err) {
    console.error(err.message);
    server.kill();
    process.exit(1);
  }

  const playwrightArgs = process.argv.slice(2);
  const tests = spawn('npx', ['playwright', 'test', ...playwrightArgs], {
    stdio: 'inherit',
    shell: true,
  });

  tests.on('exit', (code) => {
    server.kill();
    process.exit(code ?? 1);
  });
}

main();
