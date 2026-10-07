import cors from 'cors';
import express from 'express';
import { agentPostsRouter } from './api/agentPosts.js';
import { authRouter } from './api/auth.js';
import { contentRouter } from './api/content.js';
import { publicContentRouter } from './api/publicContent.js';
import { coverStudioLibraryRouter } from './api/coverStudioLibrary.js';
import { mediaLibraryRouter } from './api/mediaLibrary.js';
import { ogPreviewRouter } from './api/ogPreview.js';
import { publishKitRouter } from './api/publishKit.js';
import { isOriginAllowed, loadServerEnv } from './config/env.js';
import { requireAgentToken } from './middleware/agentAuth.js';
import { requireAdmin } from './middleware/auth.js';

loadServerEnv();

const app = express();
const port = Number(process.env.PORT) || 8787;

app.use(
  cors({
    origin(origin, callback) {
      if (isOriginAllowed(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS blocked origin: ${origin ?? '(none)'}`));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: '32mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'design-bakery-api' });
});

app.use('/api/auth', authRouter);
app.use('/api/public', publicContentRouter);
app.use('/api/agent', requireAgentToken, agentPostsRouter);
app.use('/api/content', requireAdmin, contentRouter);
app.use('/api/publish-kit', requireAdmin, publishKitRouter);
app.use('/api/media-library', requireAdmin, mediaLibraryRouter);
app.use('/api/cover-studio-library', requireAdmin, coverStudioLibraryRouter);

// Link-preview / crawler Open Graph rendering for the SPA blog and case-study
// routes (issue #80 Step E). These are the public site paths, not `/api/*`: Caddy
// proxies them here from after its filesystem handlers, so real files still win.
app.use(ogPreviewRouter);

app.use(
  (
    err: Error & { status?: number; type?: string },
    _req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    if (res.headersSent) {
      next(err);
      return;
    }
    if (err?.type === 'entity.parse.failed' || err instanceof SyntaxError) {
      res.status(400).json({ ok: false, code: 'VALIDATION', message: 'Invalid JSON request body.' });
      return;
    }
    console.error('[api] unhandled', err);
    res.status(500).json({ ok: false, code: 'INTERNAL', message: 'Request failed.' });
  },
);

app.listen(port, () => {
  console.log(`[api] design-bakery-api http://localhost:${port}`);
  console.log('[api] content=octo  POST /api/auth/login  GET /api/public/blogs  GET /api/public/assets/:fileId  /api/content/*');
  console.log('[api] POST /api/agent/posts  PUT /api/agent/posts/:numericId  POST /api/publish-kit  /api/media-library/*  /api/cover-studio-library/*  GET /health');
});
