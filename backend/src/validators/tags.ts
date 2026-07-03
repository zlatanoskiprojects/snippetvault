import { body, param, ValidationChain } from 'express-validator';

const tagIdValidation: ValidationChain[] = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Invalid tag id'),
];

const createTagValidation: ValidationChain[] = [
    body('name')
        .isString().trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters'),
];

const tagSnippetValidation: ValidationChain[] = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Invalid tag id'),

    param('snippetId')
        .isInt({ min: 1 })
        .withMessage('Invalid snippet id'),
];

export { tagIdValidation, createTagValidation, tagSnippetValidation };
