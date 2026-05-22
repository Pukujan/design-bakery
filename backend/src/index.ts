import cors from 'cors';
import express from 'express';
import { ensureFirebaseAdminApp } from '../functions/lib/firebaseApp.js';
import { requireAdmin } from './auth.js';
import { loadServerEnv, parseAllowedOrigins } from './env.js';
import { blogAgentRouter } from './routes/blogAgent.js';
import { publishKitRouter } from './routes/publishKit.js';

loadServerEnv();
ensureFirebaseAdminApp();

const app = express();
const port = Number(process.env.PORT) || 8787;

app.use(
  cors({
    origin: parseAllowedOrigins(),
    credentials: true,
  }),
);
app.use(express.json({ limit: '32mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'design-bakery-api' });
});

app.use('/api/publish-kit', requireAdmin, publishKitRouter);
app.use('/api/blog-agent', requireAdmin, blogAgentRouter);

app.listen(port, () => {
  console.log(`[api] design-bakery-api http://localhost:${port}`);
  console.log('[api] POST /api/publish-kit  POST /api/blog-agent  GET /health');
});
