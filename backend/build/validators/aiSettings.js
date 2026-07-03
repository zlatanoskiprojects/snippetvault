"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAiSettingsValidation = exports.updateAiSettingsValidation = exports.createAiSettingsValidation = void 0;
const express_validator_1 = require("express-validator");
const createAiSettingsValidation = [
    (0, express_validator_1.body)('provider_type')
        .isString().withMessage('Provider type must be a string')
        .trim()
        .notEmpty().withMessage('Provider type is required')
        .isIn(['openai', 'anthropic', 'ollama', 'lmstudio']).withMessage('Provider type must be one of: openai, anthropic, ollama, lmstudio'),
    (0, express_validator_1.body)('api_key')
        .isString().withMessage('API key must be a string')
        .trim()
        .notEmpty().withMessage('API key is required')
        .isLength({ max: 500 }).withMessage('API key cannot exceed 500 characters'),
    (0, express_validator_1.body)('model_name')
        .optional({ nullable: true })
        .isString().withMessage('Model name must be a string')
        .trim()
        .isLength({ max: 100 }).withMessage('Model name cannot exceed 100 characters'),
    (0, express_validator_1.body)('base_url')
        .optional({ nullable: true })
        .isURL({ require_tld: false }).withMessage('Base URL must be a valid URL'),
    (0, express_validator_1.body)('is_configured')
        .optional()
        .isBoolean().withMessage('is_configured must be a boolean'),
];
exports.createAiSettingsValidation = createAiSettingsValidation;
const updateAiSettingsValidation = [
    (0, express_validator_1.body)('provider_type')
        .optional()
        .isString().withMessage('Provider type must be a string')
        .trim()
        .notEmpty().withMessage('Provider type cannot be empty')
        .isIn(['openai', 'anthropic', 'ollama', 'lmstudio']).withMessage('Provider type must be one of: openai, anthropic, ollama, lmstudio'),
    (0, express_validator_1.body)('api_key')
        .optional()
        .isString().withMessage('API key must be a string')
        .trim()
        .notEmpty().withMessage('API key cannot be empty')
        .isLength({ max: 500 }).withMessage('API key cannot exceed 500 characters'),
    (0, express_validator_1.body)('model_name')
        .optional({ nullable: true })
        .isString().withMessage('Model name must be a string')
        .trim()
        .isLength({ max: 100 }).withMessage('Model name cannot exceed 100 characters'),
    (0, express_validator_1.body)('base_url')
        .optional({ nullable: true })
        .isURL({ require_tld: false }).withMessage('Base URL must be a valid URL'),
    (0, express_validator_1.body)('is_configured')
        .optional()
        .isBoolean().withMessage('is_configured must be a boolean'),
];
exports.updateAiSettingsValidation = updateAiSettingsValidation;
const deleteAiSettingsValidation = [];
exports.deleteAiSettingsValidation = deleteAiSettingsValidation;
