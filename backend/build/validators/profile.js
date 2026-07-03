"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePasswordValidation = exports.updateProfileValidation = void 0;
const express_validator_1 = require("express-validator");
const updateProfileValidation = [
    (0, express_validator_1.body)('username')
        .optional()
        .isString().trim()
        .notEmpty().withMessage('Username cannot be empty')
        .isLength({ max: 32 }).withMessage('Username cannot exceed 32 characters'),
    (0, express_validator_1.body)('display_name')
        .optional({ nullable: true })
        .isString().trim()
        .isLength({ max: 64 }).withMessage('Display name cannot exceed 64 characters'),
    (0, express_validator_1.body)('bio')
        .optional({ nullable: true })
        .isLength({ max: 1000 }).withMessage('Bio cannot exceed 1000 characters'),
    (0, express_validator_1.body)('email')
        .optional()
        .isString().trim()
        .isEmail().withMessage('Invalid email address')
        .isLength({ max: 255 }).withMessage('Email cannot exceed 255 characters'),
];
exports.updateProfileValidation = updateProfileValidation;
const changePasswordValidation = [
    (0, express_validator_1.body)('currentPassword')
        .isString()
        .notEmpty().withMessage('Current password is required'),
    (0, express_validator_1.body)('newPassword')
        .isString().trim()
        .notEmpty().withMessage('New password is required')
        .isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
];
exports.changePasswordValidation = changePasswordValidation;
