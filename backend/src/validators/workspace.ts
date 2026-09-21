import { body, param, ValidationChain } from 'express-validator';

const workspaceIdValidation: ValidationChain[] = [
    param('workspaceId')
        .isInt({ min: 1, max: 2147483647 })
        .withMessage('Invalid workspace id'),
];

const workspaceMemberParamsValidation: ValidationChain[] = [
    ...workspaceIdValidation,
    param('userId')
        .isInt({ min: 1, max: 2147483647 })
        .withMessage('Invalid user id'),
];

const createWorkspaceValidation: ValidationChain[] = [
    body().custom((value: unknown) => value !== null && typeof value === 'object'
        && !Array.isArray(value) && Object.keys(value).every((field) => field === 'name'))
        .withMessage('Only name is allowed'),
    body('name')
        .isString().withMessage('Name must be a string').bail()
        .trim()
        .notEmpty().withMessage('Name is required').bail()
        .isLength({ max: 255 }).withMessage('Name cannot exceed 255 characters'),
];

const updateWorkspaceValidation: ValidationChain[] = [
    ...workspaceIdValidation,
    ...createWorkspaceValidation,
];

const updateWorkspaceMemberRoleValidation: ValidationChain[] = [
    ...workspaceMemberParamsValidation,
    body().custom((value: unknown) => value !== null && typeof value === 'object'
        && !Array.isArray(value) && Object.keys(value).every((field) => field === 'role'))
        .withMessage('Only role is allowed'),
    body('role')
        .isString().withMessage('Role must be a string').bail()
        .isIn(['editor', 'viewer']).withMessage('Role must be editor or viewer'),
];

const createWorkspaceInvitationValidation: ValidationChain[] = [
    ...workspaceIdValidation,
    body().custom((value: unknown) => value !== null && typeof value === 'object'
        && !Array.isArray(value) && Object.keys(value).every((field) => ['email', 'role'].includes(field)))
        .withMessage('Only email and role are allowed'),
    body('email')
        .isString().withMessage('Email must be a string').bail()
        .trim()
        .notEmpty().withMessage('Email is required').bail()
        .isLength({ max: 255 }).withMessage('Email cannot exceed 255 characters').bail()
        .isEmail().withMessage('Invalid email'),
    body('role')
        .isString().withMessage('Role must be a string').bail()
        .isIn(['editor', 'viewer']).withMessage('Role must be editor or viewer'),
];

export {
    workspaceIdValidation,
    workspaceMemberParamsValidation,
    createWorkspaceValidation,
    updateWorkspaceValidation,
    updateWorkspaceMemberRoleValidation,
    createWorkspaceInvitationValidation,
};
