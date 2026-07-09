import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { toNodeHandler } from 'better-auth/node';
import path from 'path';
import { auth } from './lib/auth';
import snippetRoutes from './routes/snippets';
import collectionRoutes from './routes/collections';
import tagRoutes from './routes/tags';
import commentRoutes from './routes/comments';
import aiSettingsRoutes from './routes/aiSettings';
import profileRoutes from './routes/profile';

const app = express();
const PORT = process.env.PORT || 3000;

const ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
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

app.all('/api/auth/{*any}', toNodeHandler(auth));

app.use(express.json());

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
