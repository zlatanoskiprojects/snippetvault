import { body, param, ValidationChain } from 'express-validator';
import { SUPPORTED_LANGUAGES } from '../constants/languages';

const versionIdValidation: ValidationChain[] = [
    param('versionId')
        .isInt({ min: 1 })
        .withMessage('Invalid version id'),
];

const snippetIdValidation: ValidationChain[] = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Invalid snippet id'),
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

    body('collection_id')
        .optional({ nullable: true })
        .isInt({ min: 1 }).withMessage('Invalid collection_id'),
];

const updateSnippetValidation: ValidationChain[] = [
    param('id')
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

    body('collection_id')
        .optional({ nullable: true })
        .isInt({ min: 1 }).withMessage('Invalid collection_id'),

    body('change_note')
        .optional({ nullable: true })
        .isString()
        .isLength({ max: 500 }).withMessage('Change note cannot exceed 500 characters'),
];

export { snippetIdValidation, createSnippetValidation, updateSnippetValidation, versionIdValidation };
