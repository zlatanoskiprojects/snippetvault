import { body, param, ValidationChain } from 'express-validator';

const projectIdValidation: ValidationChain[] = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Invalid project id'),
];

const createProjectValidation: ValidationChain[] = [
    body('name')
        .isString().trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ max: 255 }).withMessage('Name cannot exceed 255 characters'),

    body('description')
        .optional({ nullable: true })
        .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
];

const updateProjectValidation: ValidationChain[] = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Invalid project id'),

    body('name')
        .optional()
        .isString().trim()
        .notEmpty().withMessage('Name cannot be empty')
        .isLength({ max: 255 }).withMessage('Name cannot exceed 255 characters'),

    body('description')
        .optional({ nullable: true })
        .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
];

const assignSnippetValidation: ValidationChain[] = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Invalid project id'),

    param('snippetId')
        .isInt({ min: 1 })
        .withMessage('Invalid snippet id'),
];

export { projectIdValidation, createProjectValidation, updateProjectValidation, assignSnippetValidation };
