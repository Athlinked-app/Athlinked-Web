const { execSync } = require('child_process');
const PORT = process.env.PORT || 3001;

try {
  const output = execSync(`lsof -ti:${PORT}`, {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'ignore'],
  }).trim();

  if (output) {
    const pids = output.split('\n').filter(pid => pid.trim());
    console.log(`Found process(es) on port ${PORT}: ${pids.join(', ')}`);
    pids.forEach(pid => {
      try {
        execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
        console.log(`✅ Killed process ${pid}`);
      } catch (killError) {
        console.log(
          `⚠️  Could not kill process ${pid} (may have already exited)`
        );
      }
    });
  } else {
    console.log(`✅ No process found on port ${PORT}`);
  }
} catch (error) {
  if (error.status === 1 || error.code === 1) {
    console.log(`✅ No process found on port ${PORT}`);
  } else {
    console.log(`⚠️  Could not check port ${PORT}: ${error.message}`);
  }
}
