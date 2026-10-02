import { param, type ValidationChain } from 'express-validator';

export const invitationIdValidation: ValidationChain[] = [
    param('invitationId')
        .isInt({ min: 1, max: 2147483647 })
        .withMessage('Invalid invitation id'),
];
