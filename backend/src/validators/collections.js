import { body, param } from 'express-validator';

export const collectionIdValidation = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Invalid collection id'),
];

export const createCollectionValidation = [
    body('name')
        .isString().trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ max: 255 }).withMessage('Name cannot exceed 255 characters'),

    body('description')
        .optional({ nullable: true })
        .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
];

export const updateCollectionValidation = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Invalid collection id'),

    body('name')
        .optional()
        .isString().trim()
        .notEmpty().withMessage('Name cannot be empty')
        .isLength({ max: 255 }).withMessage('Name cannot exceed 255 characters'),

    body('description')
        .optional({ nullable: true })
        .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
];

export const assignSnippetValidation = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Invalid collection id'),

    param('snippetId')
        .isInt({ min: 1 })
        .withMessage('Invalid snippet id'),
];