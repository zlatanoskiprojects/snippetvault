"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tagSnippetValidation = exports.createTagValidation = exports.tagIdValidation = void 0;
const express_validator_1 = require("express-validator");
const tagIdValidation = [
    (0, express_validator_1.param)('id')
        .isInt({ min: 1 })
        .withMessage('Invalid tag id'),
];
exports.tagIdValidation = tagIdValidation;
const createTagValidation = [
    (0, express_validator_1.body)('name')
        .isString().trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters'),
];
exports.createTagValidation = createTagValidation;
const tagSnippetValidation = [
    (0, express_validator_1.param)('id')
        .isInt({ min: 1 })
        .withMessage('Invalid tag id'),
    (0, express_validator_1.param)('snippetId')
        .isInt({ min: 1 })
        .withMessage('Invalid snippet id'),
];
exports.tagSnippetValidation = tagSnippetValidation;
