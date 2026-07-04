import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import PgSession from 'connect-pg-simple';
import path from 'path';
import { pool } from './lib/db';
import authRoutes from './routes/auth';
import snippetRoutes from './routes/snippets';
import collectionRoutes from './routes/collections';
import tagRoutes from './routes/tags';
import commentRoutes from './routes/comments';
import aiSettingsRoutes from './routes/aiSettings';
import profileRoutes from './routes/profile';

const PostgresqlStore = PgSession(session);

const app = express();
const PORT = process.env.PORT || 3000;

const ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://88.200.63.148:30162',
];

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

app.use(express.json());

const sessionStore = new PostgresqlStore({
    pool,
    createTableIfMissing: true,
});

app.use(session({
    secret: process.env.SESSION_SECRET as string,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
        httpOnly: true,
        secure: false,
        maxAge: 1000 * 60 * 60,
    },
}));

app.use('/api/auth', authRoutes);
app.use('/api/snippets', snippetRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api', commentRoutes);
app.use('/api', aiSettingsRoutes);

const frontendBuildPath = path.join(__dirname, '../dist/frontend-build');
console.log('Serving static files from:', frontendBuildPath);
app.use(express.static(frontendBuildPath));

app.get('/{*path}', (req, res) => {
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
