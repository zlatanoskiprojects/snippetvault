import { param, type ValidationChain } from 'express-validator';

export const invitationIdValidation: ValidationChain[] = [
    param('invitationId')
        .isInt({ min: 1, max: 2147483647 })
        .withMessage('Invalid invitation id'),
];

export const invitationTokenValidation: ValidationChain[] = [
    param('token')
        .custom((value: unknown) => typeof value === 'string' && /^[0-9a-f]{64}$/.test(value))
        .withMessage('Invalid invitation token')
        .hide(),
];
