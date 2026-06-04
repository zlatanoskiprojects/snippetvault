const { body, param } = require('express-validator');

const versionIdValidation = [
    param('versionId')
        .isInt({ min: 1 })
        .withMessage('Invalid version id'),
];

const snippetIdValidation = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Invalid snippet id'),
];

const createSnippetValidation = [
    body('title')
        .isString().trim()
        .notEmpty().withMessage('Title is required')
        .isLength({ max: 255 }).withMessage('Title cannot exceed 255 characters'),

    body('code')
        .isString().trim()
        .notEmpty().withMessage('Code is required')
        .isLength({ max: 65000 }).withMessage('Code too large'),

    body('language')
        .isString().trim()
        .notEmpty().withMessage('Language is required')
        .isLength({ max: 50 }).withMessage('Language cannot exceed 50 characters'),

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

const updateSnippetValidation = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Invalid snippet id'),

    body('title')
        .optional()
        .isString().trim()
        .notEmpty().withMessage('Title cannot be empty')
        .isLength({ max: 255 }).withMessage('Title cannot exceed 255 characters'),

    body('code')
        .optional()
        .isString().trim()
        .notEmpty().withMessage('Code cannot be empty')
        .isLength({ max: 65000 }).withMessage('Code too large'),

    body('language')
        .optional()
        .isString().trim()
        .notEmpty().withMessage('Language cannot be empty')
        .isLength({ max: 50 }).withMessage('Language cannot exceed 50 characters'),

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

module.exports = { snippetIdValidation, createSnippetValidation, updateSnippetValidation, versionIdValidation };