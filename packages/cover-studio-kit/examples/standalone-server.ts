/**
 * Minimal Express server for Cover Studio export bundle.
 * Adjust import paths after copying into your repo.
 */
import cors from 'cors';
import express from 'express';
import { publishKitRouter } from '../../backend/src/api/publishKit.js';
import { coverStudioLibraryRouter } from '../../backend/src/api/coverStudioLibrary.js';
import { mediaLibraryRouter } from '../../backend/src/api/mediaLibrary.js';
import { requireAdmin } from '../../backend/src/middleware/auth.js';
import { mountCoverStudioRoutes } from '../src/server/index.js';

const app = express();
const port = Number(process.env.PORT) || 8787;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '32mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'cover-studio-api' });
});

// Replace requireAdmin with your public auth / rate-limit middleware if needed.
mountCoverStudioRoutes(app, {
  publishKitRouter,
  coverStudioLibraryRouter,
  mediaLibraryRouter,
  requireAuth: requireAdmin,
});

app.listen(port, () => {
  console.log(`Cover Studio API http://localhost:${port}`);
});
