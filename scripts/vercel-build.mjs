import { spawn } from 'node:child_process';
import path from 'node:path';

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    console.log(`> ${cmd} ${args.join(' ')}`);
    const p = spawn(cmd, args, { stdio: 'inherit', ...opts });
    p.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} exited with code ${code}`));
    });
    p.on('error', reject);
  });
}

(async () => {
  try {
    const fixer = path.resolve('scripts', 'fix-sql-insert.mjs');
    const importer = path.resolve('scripts', 'import-sql-to-mongodb.mjs');
    const sql = 'quizbee (1).sql';
    const fixed = 'quizbee-fixed.sql';

    console.log('Running SQL fixer...');
    await run('node', [fixer, sql, fixed]);

    if (!process.env.MONGODB_URI) {
      console.log('MONGODB_URI not set — skipping import.');
      return;
    }

    // Only import on production deploys by default
    if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') {
      console.log(`VERCEL_ENV=${process.env.VERCEL_ENV} — skipping import on non-production deploy.`);
      return;
    }

    console.log('Running importer...');
    await run('node', [importer, fixed]);

    console.log('Import complete.');
  } catch (err) {
    console.error('Build import step failed:', err);
    process.exit(1);
  }
})();
