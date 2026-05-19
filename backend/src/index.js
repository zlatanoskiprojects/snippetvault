import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import snippetRoutes from './routes/snippets.js';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;


app.use(cors());


app.use(express.json());

app.use('/api/auth', authRoutes);

app.use('/api/snippets', snippetRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
