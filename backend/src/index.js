require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
const authRoutes = require('./routes/auth.js');
const snippetRoutes = require('./routes/snippets.js');
const collectionRoutes = require('./routes/collections.js');
const tagRoutes = require('./routes/tags.js');
const commentRoutes = require('./routes/comments.js');
const aiSettingsRoutes = require('./routes/aiSettings.js');
const profileRoutes = require('./routes/profile.js');

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

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
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