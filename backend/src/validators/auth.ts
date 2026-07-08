import { Request, Response, NextFunction } from 'express';
import { body, ValidationChain, validationResult } from 'express-validator';

export const registerValidation: ValidationChain[] = [
    body('email').isEmail().withMessage('Invalid email address').normalizeEmail(),
    body('username').trim().isLength({ min: 3, max: 32 }).matches(/^[a-zA-Z0-9_-]+$/).withMessage('Username must be between 3 and 32 characters'),
    body('password').trim().isLength({ min: 8 }).withMessage('Password must be at least 8 characters').isLength({ max: 128 }).withMessage('Password is too long!'),
];

export const loginValidation: ValidationChain[] = [

    body('email').isEmail().withMessage('Invalid email address').normalizeEmail(),
    body('password').trim().isLength({ min: 1 }).withMessage('Password is required'),
];

export function handleValidation(req: Request, res: Response, next: NextFunction) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
}
