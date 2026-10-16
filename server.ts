
import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import dotenv from 'dotenv';
import cors from 'cors';
import apiRouter from './server/routes/api.js';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);
  const isProduction = process.env.NODE_ENV === 'production';

  // Allow requests from the deployed Vercel frontend
  const allowedOrigins = [
    'https://finnguard-ai-ck12.vercel.app',
    'https://finnguard-ai-ck12-ll6z6m2cv-vars69658-9301s-projects.vercel.app',
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Origin not allowed by CORS'));
        }
      },
      methods: [
        'GET',
        'POST',
        'PUT',
        'PATCH',
        'DELETE',
        'OPTIONS',
      ],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Parse incoming request bodies
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logger for API calls
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      const start = Date.now();

      res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(
          `[API] ${req.method} ${req.path} -> ${res.statusCode} (${duration}ms)`
        );
      });
    }

    next();
  });

  // Mount API Router
  app.use('/api', apiRouter);

  // Catch-all 404 handler for unmatched API requests
  app.all('/api/*', (req, res) => {
    res.status(404).json({
      error: `API endpoint ${req.method} ${req.originalUrl} not found`,
    });
  });

  // Global JSON error handler for API exceptions
  app.use(
    '/api',
    (
      err: any,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      console.error('[API Error Caught]', err);

      if (res.headersSent) {
        return next(err);
      }

      res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
      });
    }
  );

  // Mount Frontend
  if (!isProduction) {
    const { createServer } = await import('vite');

    const vite = await createServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch:
          process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');

    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));

      app.get('*', (req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(
      `✓ FinGuard AI Server listening at http://0.0.0.0:${PORT}`
    );
    console.log(`✓ Mode: ${isProduction ? 'Production' : 'Development'}`);
    console.log(
      `✓ Gemini AI: ${
        process.env.GEMINI_API_KEY
          ? 'Configured'
          : 'Offline Heuristic Fallback'
      }`
    );
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup failure:', err);
  process.exit(1);
});
