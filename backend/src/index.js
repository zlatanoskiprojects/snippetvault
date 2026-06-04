require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const authRoutes = require('./routes/auth.js');
const snippetRoutes = require('./routes/snippets.js');
const collectionRoutes = require('./routes/collections.js');
const tagRoutes = require('./routes/tags.js');
const commentRoutes = require('./routes/comments.js');
const aiSettingsRoutes = require('./routes/aiSettings.js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
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
app.use('/api', commentRoutes);
app.use('/api', aiSettingsRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});