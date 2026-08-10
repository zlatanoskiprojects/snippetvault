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

const setPasswordValidation: ValidationChain[] = [
    body('newPassword')
        .isString()
        .notEmpty().withMessage('New password is required')
        .isLength({ min: 8, max: 128 }).withMessage('New password must be between 8 and 128 characters'),
];

export { updateProfileValidation, changePasswordValidation, setPasswordValidation };
