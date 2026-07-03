"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.versionIdValidation = exports.updateSnippetValidation = exports.createSnippetValidation = exports.snippetIdValidation = void 0;
const express_validator_1 = require("express-validator");
const versionIdValidation = [
    (0, express_validator_1.param)('versionId')
        .isInt({ min: 1 })
        .withMessage('Invalid version id'),
];
exports.versionIdValidation = versionIdValidation;
const snippetIdValidation = [
    (0, express_validator_1.param)('id')
        .isInt({ min: 1 })
        .withMessage('Invalid snippet id'),
];
exports.snippetIdValidation = snippetIdValidation;
const createSnippetValidation = [
    (0, express_validator_1.body)('title')
        .isString().trim()
        .notEmpty().withMessage('Title is required')
        .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
    (0, express_validator_1.body)('code')
        .isString().trim()
        .notEmpty().withMessage('Code is required')
        .isLength({ max: 65000 }).withMessage('Code too large'),
    (0, express_validator_1.body)('language')
        .isString().trim()
        .notEmpty().withMessage('Language is required')
        .isLength({ max: 50 }).withMessage('Language cannot exceed 50 characters'),
    (0, express_validator_1.body)('description')
        .optional({ nullable: true })
        .isLength({ max: 5000 }).withMessage('Description cannot exceed 5000 characters'),
    (0, express_validator_1.body)('visibility')
        .optional()
        .isIn(['public', 'private']).withMessage('Visibility must be public or private'),
    (0, express_validator_1.body)('collection_id')
        .optional({ nullable: true })
        .isInt({ min: 1 }).withMessage('Invalid collection_id'),
];
exports.createSnippetValidation = createSnippetValidation;
const updateSnippetValidation = [
    (0, express_validator_1.param)('id')
        .isInt({ min: 1 })
        .withMessage('Invalid snippet id'),
    (0, express_validator_1.body)('title')
        .optional()
        .isString().trim()
        .notEmpty().withMessage('Title cannot be empty')
        .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
    (0, express_validator_1.body)('code')
        .optional()
        .isString().trim()
        .notEmpty().withMessage('Code cannot be empty')
        .isLength({ max: 65000 }).withMessage('Code too large'),
    (0, express_validator_1.body)('language')
        .optional()
        .isString().trim()
        .notEmpty().withMessage('Language cannot be empty')
        .isLength({ max: 50 }).withMessage('Language cannot exceed 50 characters'),
    (0, express_validator_1.body)('description')
        .optional({ nullable: true })
        .isLength({ max: 5000 }).withMessage('Description cannot exceed 5000 characters'),
    (0, express_validator_1.body)('visibility')
        .optional()
        .isIn(['public', 'private']).withMessage('Visibility must be public or private'),
    (0, express_validator_1.body)('collection_id')
        .optional({ nullable: true })
        .isInt({ min: 1 }).withMessage('Invalid collection_id'),
    (0, express_validator_1.body)('change_note')
        .optional({ nullable: true })
        .isString()
        .isLength({ max: 500 }).withMessage('Change note cannot exceed 500 characters'),
];
exports.updateSnippetValidation = updateSnippetValidation;
