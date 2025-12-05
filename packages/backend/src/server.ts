import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { createHandler } from 'graphql-http/lib/use/express';
import { ruruHTML } from 'ruru/server';
import { schema } from './graphql/schema.js';
import { authMiddleware, AuthRequest } from './middleware/auth.middleware.js';

const app = express();
const PORT = process.env.PORT || 4000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Rate limiting for security
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiting for auth operations
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 auth requests per window
  message: { error: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());
app.use(limiter);
app.use(authMiddleware);

// GraphQL endpoint with auth rate limiting
app.all(
  '/graphql',
  authLimiter,
  createHandler({
    schema,
    context: (req) => ({
      user: (req.raw as AuthRequest).user,
      token: (req.raw as AuthRequest).token,
    }),
  })
);

// GraphiQL interface (development only)
if (process.env.NODE_ENV !== 'production') {
  app.get('/graphiql', (_req, res) => {
    res.type('html');
    res.end(ruruHTML({ endpoint: '/graphql' }));
  });
}

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 ShieldForge Backend running at http://localhost:${PORT}`);
  console.log(`📊 GraphQL endpoint: http://localhost:${PORT}/graphql`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`🔍 GraphiQL: http://localhost:${PORT}/graphiql`);
  }
});

export default app;
