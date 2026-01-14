#!/usr/bin/env node
const { exec } = require('child_process');

const port = process.argv[2] || process.env.PORT || '3001';

function run(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
      if (err) return reject(err);
      resolve(stdout.trim());
    });
  });
}

(async () => {
  try {
    const out = await run(`lsof -ti:${port}`);
    if (!out) {
      console.log(`No process found listening on port ${port}.`);
      process.exit(0);
    }
    const pids = out.split(/\s+/).filter(Boolean);
    for (const pid of pids) {
      try {
        process.kill(Number(pid), 'SIGKILL');
        console.log(`Killed PID ${pid} on port ${port}`);
      } catch (e) {
        // fallback to shell kill if process.kill fails
        try {
          await run(`kill -9 ${pid}`);
          console.log(`Killed PID ${pid} via kill -9`);
        } catch (err) {
          console.error(`Failed to kill PID ${pid}: ${err.message}`);
        }
      }
    }
  } catch (err) {
    console.error(
      `Unable to query port ${port}. Make sure 'lsof' is installed.`
    );
    console.error(err.message || err);
    process.exit(1);
  }
})();
