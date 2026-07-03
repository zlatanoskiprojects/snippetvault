import { body, ValidationChain } from 'express-validator';

const updateProfileValidation: ValidationChain[] = [
    body('username')
        .optional()
        .isString().trim()
        .notEmpty().withMessage('Username cannot be empty')
        .isLength({ max: 32 }).withMessage('Username cannot exceed 32 characters'),

    body('display_name')
        .optional({ nullable: true })
        .isString().trim()
        .isLength({ max: 64 }).withMessage('Display name cannot exceed 64 characters'),

    body('bio')
        .optional({ nullable: true })
        .isLength({ max: 1000 }).withMessage('Bio cannot exceed 1000 characters'),

    body('email')
        .optional()
        .isString().trim()
        .isEmail().withMessage('Invalid email address')
        .isLength({ max: 255 }).withMessage('Email cannot exceed 255 characters'),
];

const changePasswordValidation: ValidationChain[] = [
    body('currentPassword')
        .isString()
        .notEmpty().withMessage('Current password is required'),

    body('newPassword')
        .isString().trim()
        .notEmpty().withMessage('New password is required')
        .isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
];

export { updateProfileValidation, changePasswordValidation };
