import { body, param, ValidationChain } from 'express-validator';

const listProjectsValidation: ValidationChain[] = [
    param('workspaceId')
        .isInt({ min: 1, max: 2147483647 })
        .withMessage('Invalid workspace id'),
];

const projectIdValidation: ValidationChain[] = [
    param('projectId')
        .isInt({ min: 1, max: 2147483647 })
        .withMessage('Invalid project id'),
];

const createProjectValidation: ValidationChain[] = [
    body().custom((value: unknown) => value !== null && typeof value === 'object'
        && !Array.isArray(value)
        && Object.keys(value).every((field) => ['name', 'description'].includes(field)))
        .withMessage('Only name and description are allowed'),
    body('name')
        .isString().withMessage('Name must be a string').bail()
        .trim()
        .notEmpty().withMessage('Name is required').bail()
        .isLength({ max: 255 }).withMessage('Name cannot exceed 255 characters'),
    body('description')
        .optional({ nullable: true })
        .isString().withMessage('Description must be a string').bail()
        .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
];

const updateProjectValidation: ValidationChain[] = [
    param('projectId')
        .isInt({ min: 1, max: 2147483647 })
        .withMessage('Invalid project id'),
    body().custom((value: unknown) => value !== null && typeof value === 'object'
        && !Array.isArray(value) && Object.keys(value).length > 0
        && Object.keys(value).every((field) => ['name', 'description'].includes(field)))
        .withMessage('Only name and description are allowed, and at least one is required'),
    body('name')
        .optional()
        .isString().withMessage('Name must be a string').bail()
        .trim()
        .notEmpty().withMessage('Name cannot be empty').bail()
        .isLength({ max: 255 }).withMessage('Name cannot exceed 255 characters'),
    body('description')
        .optional({ nullable: true })
        .isString().withMessage('Description must be a string').bail()
        .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
];

export { listProjectsValidation, projectIdValidation, createProjectValidation, updateProjectValidation };
