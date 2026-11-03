/** One refresh of the copilot's news list, for a timer: `node backend/lib/copilot/newsJob.js`. */
import { loadServerEnv } from '../config/env.js';
import { refreshNews } from './news.js';

loadServerEnv();

refreshNews()
  .then((count) => console.log(`[news] stored ${count} items`))
  .catch((error) => {
    console.error('[news] refresh failed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
