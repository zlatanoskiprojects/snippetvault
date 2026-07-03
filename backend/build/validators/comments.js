"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCommentValidation = exports.createCommentValidation = exports.commentIdValidation = void 0;
const express_validator_1 = require("express-validator");
const commentIdValidation = [
    (0, express_validator_1.param)('id')
        .isInt({ min: 1 }).withMessage('Invalid comment id'),
];
exports.commentIdValidation = commentIdValidation;
const createCommentValidation = [
    (0, express_validator_1.param)('snippetId')
        .isInt({ min: 1 }).withMessage('Invalid snippet id'),
    (0, express_validator_1.body)('content')
        .isString().withMessage('Content must be a string')
        .trim()
        .notEmpty().withMessage('Content is required')
        .isLength({ max: 2000 }).withMessage('Content cannot exceed 2000 characters'),
];
exports.createCommentValidation = createCommentValidation;
const updateCommentValidation = [
    (0, express_validator_1.param)('id')
        .isInt({ min: 1 }).withMessage('Invalid comment id'),
    (0, express_validator_1.body)('content')
        .optional()
        .isString().withMessage('Content must be a string')
        .trim()
        .notEmpty().withMessage('Content cannot be empty')
        .isLength({ max: 2000 }).withMessage('Content cannot exceed 2000 characters'),
];
exports.updateCommentValidation = updateCommentValidation;
