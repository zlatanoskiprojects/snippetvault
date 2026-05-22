jsimport { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { pool } from '../lib/db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.post("/", )