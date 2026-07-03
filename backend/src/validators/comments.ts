import { body, param, ValidationChain } from 'express-validator';

const commentIdValidation: ValidationChain[] = [
    param('id')
        .isInt({ min: 1 }).withMessage('Invalid comment id'),
];

const createCommentValidation: ValidationChain[] = [
    param('snippetId')
        .isInt({ min: 1 }).withMessage('Invalid snippet id'),

    body('content')
        .isString().withMessage('Content must be a string')
        .trim()
        .notEmpty().withMessage('Content is required')
        .isLength({ max: 2000 }).withMessage('Content cannot exceed 2000 characters'),
];

const updateCommentValidation: ValidationChain[] = [
    param('id')
        .isInt({ min: 1 }).withMessage('Invalid comment id'),

    body('content')
        .optional()
        .isString().withMessage('Content must be a string')
        .trim()
        .notEmpty().withMessage('Content cannot be empty')
        .isLength({ max: 2000 }).withMessage('Content cannot exceed 2000 characters'),
];

export { commentIdValidation, createCommentValidation, updateCommentValidation };
