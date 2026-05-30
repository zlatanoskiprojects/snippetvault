import { body, param } from 'express-validator';

export const tagIdValidation = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Invalid tag id'),
];

export const createTagValidation = [
    body('name')
        .isString().trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters'),
];

export const tagSnippetValidation = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Invalid tag id'),

    param('snippetId')
        .isInt({ min: 1 })
        .withMessage('Invalid snippet id'),
];