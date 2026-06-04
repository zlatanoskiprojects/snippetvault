const { body, param } = require('express-validator');

const collectionIdValidation = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Invalid collection id'),
];

const createCollectionValidation = [
    body('name')
        .isString().trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ max: 255 }).withMessage('Name cannot exceed 255 characters'),

    body('description')
        .optional({ nullable: true })
        .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
];

const updateCollectionValidation = [
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

const assignSnippetValidation = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Invalid collection id'),

    param('snippetId')
        .isInt({ min: 1 })
        .withMessage('Invalid snippet id'),
];

module.exports = { collectionIdValidation, createCollectionValidation, updateCollectionValidation, assignSnippetValidation };