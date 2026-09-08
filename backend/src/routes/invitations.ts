import { Router } from 'express';
import authMiddleware from '../middleware/authMiddleware';

const router = Router();

router.get('/', authMiddleware, (_req, res) => res.sendStatus(501));

router.post('/', authMiddleware, (_req, res) => res.sendStatus(501));

router.post('/:projectId/accept', authMiddleware, (_req, res) => res.sendStatus(501));

router.delete('/:projectId', authMiddleware, (_req, res) => res.sendStatus(501));

export default router;
