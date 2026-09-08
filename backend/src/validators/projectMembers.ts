import { body, param, ValidationChain } from 'express-validator';

const projectMemberProjectIdValidation: ValidationChain[] = [
    param('projectId')
        .isInt({ min: 1 })
        .withMessage('Invalid project id'),
];

const projectMemberParamsValidation: ValidationChain[] = [
    ...projectMemberProjectIdValidation,
    param('userId')
        .isInt({ min: 1 })
        .withMessage('Invalid user id'),
];

const updateProjectMemberRoleValidation: ValidationChain[] = [
    ...projectMemberParamsValidation,
    body('role')
        .isIn(['editor', 'viewer'])
        .withMessage('Role must be editor or viewer'),
];

export { projectMemberProjectIdValidation, projectMemberParamsValidation, updateProjectMemberRoleValidation };
