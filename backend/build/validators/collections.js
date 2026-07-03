"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignSnippetValidation = exports.updateCollectionValidation = exports.createCollectionValidation = exports.collectionIdValidation = void 0;
const express_validator_1 = require("express-validator");
const collectionIdValidation = [
    (0, express_validator_1.param)('id')
        .isInt({ min: 1 })
        .withMessage('Invalid collection id'),
];
exports.collectionIdValidation = collectionIdValidation;
const createCollectionValidation = [
    (0, express_validator_1.body)('name')
        .isString().trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ max: 255 }).withMessage('Name cannot exceed 255 characters'),
    (0, express_validator_1.body)('description')
        .optional({ nullable: true })
        .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
];
exports.createCollectionValidation = createCollectionValidation;
const updateCollectionValidation = [
    (0, express_validator_1.param)('id')
        .isInt({ min: 1 })
        .withMessage('Invalid collection id'),
    (0, express_validator_1.body)('name')
        .optional()
        .isString().trim()
        .notEmpty().withMessage('Name cannot be empty')
        .isLength({ max: 255 }).withMessage('Name cannot exceed 255 characters'),
    (0, express_validator_1.body)('description')
        .optional({ nullable: true })
        .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
];
exports.updateCollectionValidation = updateCollectionValidation;
const assignSnippetValidation = [
    (0, express_validator_1.param)('id')
        .isInt({ min: 1 })
        .withMessage('Invalid collection id'),
    (0, express_validator_1.param)('snippetId')
        .isInt({ min: 1 })
        .withMessage('Invalid snippet id'),
];
exports.assignSnippetValidation = assignSnippetValidation;
