import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import snippetRoutes from './routes/snippets.js';
import collectionRoutes from './routes/collections.js';
import tagRoutes from './routes/tags.js';
import commentRoutes from './routes/comments.js';
import aiSettingsRoutes from './routes/aiSettings.js';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;


app.use(cors());


app.use(express.json());

app.use('/api/auth', authRoutes);

app.use('/api/snippets', snippetRoutes);

app.use('/api/collections', collectionRoutes);

app.use('/api/tags', tagRoutes);

app.use('/api', commentRoutes);
app.use('/api', aiSettingsRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
