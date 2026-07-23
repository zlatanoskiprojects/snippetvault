import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth';
import snippetRoutes from './routes/snippets';
import collectionRoutes from './routes/collections';
import tagRoutes from './routes/tags';
import commentRoutes from './routes/comments';
import aiSettingsRoutes from './routes/aiSettings';
import profileRoutes from './routes/profile';
import shareRoutes from './routes/share';
import { apiLimiter, shareLimiter } from './middleware/rateLimit';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { ALLOWED_ORIGINS } from './constants/origins';

const app = express();
app.set('trust proxy', 1);

const TURNSTILE_ORIGIN = 'https://challenges.cloudflare.com';
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            'script-src': ["'self'", TURNSTILE_ORIGIN],
            'frame-src': ["'self'", TURNSTILE_ORIGIN],
            'connect-src': ["'self'", TURNSTILE_ORIGIN],
        },
    },
}));
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || ALLOWED_ORIGINS.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));

app.get('/api/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
});

app.all('/api/auth/{*any}', toNodeHandler(auth));

app.use(express.json());

app.use('/api', apiLimiter);

app.use('/api/snippets', snippetRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api', commentRoutes);
app.use('/api', aiSettingsRoutes);
app.use('/api/share', shareLimiter, shareRoutes);

app.use('/api', notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
