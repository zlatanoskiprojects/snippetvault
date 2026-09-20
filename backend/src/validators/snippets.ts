import { body, param, query, ValidationChain } from 'express-validator';
import { SUPPORTED_LANGUAGES } from '../constants/languages';



const versionIdValidation: ValidationChain[] = [
    param('versionId')
        .isInt({ min: 1 })
        .withMessage('Invalid version id'),
];

const snippetIdValidation: ValidationChain[] = [
    param('snippetId')
        .isInt({ min: 1 })
        .withMessage('Invalid snippet id'),
];

const listSnippetsValidation: ValidationChain[] = [
    query().custom((value: unknown) => value !== null && typeof value === 'object'
        && !Array.isArray(value) && Object.keys(value).every((field) => field === 'q'))
        .withMessage('Only q is allowed'),
    query('q')
        .optional()
        .isString().withMessage('Search must be a string')
        .isLength({ max: 200 }).withMessage('Search cannot exceed 200 characters'),
];

const createSnippetValidation: ValidationChain[] = [
    body('title')
        .isString().trim()
        .notEmpty().withMessage('Title is required')
        .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),

    body('code')
        .isString().trim()
        .notEmpty().withMessage('Code is required')
        .isLength({ max: 65000 }).withMessage('Code too large'),

    body('language')
        .isString().trim()
        .notEmpty().withMessage('Language is required')
        .isLength({ max: 50 }).withMessage('Language cannot exceed 50 characters')
        .isIn(SUPPORTED_LANGUAGES).withMessage('Language must be one of: ' + SUPPORTED_LANGUAGES.join(', ')),

    body('description')
        .optional({ nullable: true })
        .isLength({ max: 5000 }).withMessage('Description cannot exceed 5000 characters'),

    body('visibility')
        .optional()
        .isIn(['public', 'private']).withMessage('Visibility must be public or private'),

    body('project_id')
        .optional({ nullable: true })
        .isInt({ min: 1 }).withMessage('Invalid project_id'),
];

const updateSnippetValidation: ValidationChain[] = [
    param('snippetId')
        .isInt({ min: 1 })
        .withMessage('Invalid snippet id'),

    body('title')
        .optional()
        .isString().trim()
        .notEmpty().withMessage('Title cannot be empty')
        .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),

    body('code')
        .optional()
        .isString().trim()
        .notEmpty().withMessage('Code cannot be empty')
        .isLength({ max: 65000 }).withMessage('Code too large'),

    body('language')
        .optional()
        .isString().trim()
        .notEmpty().withMessage('Language cannot be empty')
        .isLength({ max: 50 }).withMessage('Language cannot exceed 50 characters')
        .isIn(SUPPORTED_LANGUAGES).withMessage('Language must be one of: ' + SUPPORTED_LANGUAGES.join(', ')),

    body('description')
        .optional({ nullable: true })
        .isLength({ max: 5000 }).withMessage('Description cannot exceed 5000 characters'),

    body('visibility')
        .optional()
        .isIn(['public', 'private']).withMessage('Visibility must be public or private'),

    body('project_id')
        .optional({ nullable: true })
        .isInt({ min: 1 }).withMessage('Invalid project_id'),

    body('change_note')
        .optional({ nullable: true })
        .isString()
        .isLength({ max: 500 }).withMessage('Change note cannot exceed 500 characters'),
];

const shareTokenValidation: ValidationChain[] = [
    param('token')
        .isString()
        .isLength({ min: 20, max: 64 }).withMessage('Invalid share token')
        .matches(/^[A-Za-z0-9_-]+$/).withMessage('Invalid share token'),
];

export { snippetIdValidation, listSnippetsValidation, createSnippetValidation, updateSnippetValidation, versionIdValidation, shareTokenValidation };
