const { body } = require('express-validator');

const createAiSettingsValidation = [
    body('provider_type')
        .isString().withMessage('Provider type must be a string')
        .trim()
        .notEmpty().withMessage('Provider type is required')
        .isIn(['openai', 'anthropic', 'ollama', 'lmstudio']).withMessage('Provider type must be one of: openai, anthropic, ollama, lmstudio'),

    body('api_key')
        .isString().withMessage('API key must be a string')
        .trim()
        .notEmpty().withMessage('API key is required')
        .isLength({ max: 500 }).withMessage('API key cannot exceed 500 characters'),

    body('model_name')
        .optional({ nullable: true })
        .isString().withMessage('Model name must be a string')
        .trim()
        .isLength({ max: 100 }).withMessage('Model name cannot exceed 100 characters'),

    body('base_url')
        .optional({ nullable: true })
        .isURL({ require_tld: false }).withMessage('Base URL must be a valid URL'),

    body('is_configured')
        .optional()
        .isBoolean().withMessage('is_configured must be a boolean'),
];

const updateAiSettingsValidation = [
    body('provider_type')
        .optional()
        .isString().withMessage('Provider type must be a string')
        .trim()
        .notEmpty().withMessage('Provider type cannot be empty')
        .isIn(['openai', 'anthropic', 'ollama', 'lmstudio']).withMessage('Provider type must be one of: openai, anthropic, ollama, lmstudio'),

    body('api_key')
        .optional()
        .isString().withMessage('API key must be a string')
        .trim()
        .notEmpty().withMessage('API key cannot be empty')
        .isLength({ max: 500 }).withMessage('API key cannot exceed 500 characters'),

    body('model_name')
        .optional({ nullable: true })
        .isString().withMessage('Model name must be a string')
        .trim()
        .isLength({ max: 100 }).withMessage('Model name cannot exceed 100 characters'),

    body('base_url')
        .optional({ nullable: true })
        .isURL({ require_tld: false }).withMessage('Base URL must be a valid URL'),

    body('is_configured')
        .optional()
        .isBoolean().withMessage('is_configured must be a boolean'),
];

const deleteAiSettingsValidation = [];

module.exports = { createAiSettingsValidation, updateAiSettingsValidation, deleteAiSettingsValidation };