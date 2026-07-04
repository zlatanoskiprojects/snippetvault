"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = __importDefault(require("../lib/db"));
const schema_1 = require("../db/schema");
const authMiddleware_1 = __importDefault(require("../middleware/authMiddleware"));
const express_validator_1 = require("express-validator");
const aiSettings_1 = require("../validators/aiSettings");
const router = (0, express_1.Router)();
const SETTINGS_SELECTION = {
    id: schema_1.userAiSettings.id,
    userId: schema_1.userAiSettings.userId,
    providerType: schema_1.userAiSettings.providerType,
    modelName: schema_1.userAiSettings.modelName,
    baseUrl: schema_1.userAiSettings.baseUrl,
    isConfigured: schema_1.userAiSettings.isConfigured,
    createdAt: schema_1.userAiSettings.createdAt,
    updatedAt: schema_1.userAiSettings.updatedAt,
};
const mapSettings = (s) => ({
    id: s.id,
    user_id: s.userId,
    provider_type: s.providerType,
    model_name: s.modelName,
    base_url: s.baseUrl,
    is_configured: s.isConfigured,
    created_at: s.createdAt,
    updated_at: s.updatedAt,
});
router.get('/', authMiddleware_1.default, async (req, res) => {
    try {
        const rows = await db_1.default
            .select(SETTINGS_SELECTION)
            .from(schema_1.userAiSettings)
            .where((0, drizzle_orm_1.eq)(schema_1.userAiSettings.userId, req.userId));
        if (rows.length === 0) {
            return res.status(404).json({ error: 'AI settings not found' });
        }
        return res.status(200).json(mapSettings(rows[0]));
    }
    catch (error) {
        console.error('Error fetching AI settings:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/', authMiddleware_1.default, aiSettings_1.createAiSettingsValidation, async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { api_key, provider_type, model_name, base_url, is_configured } = req.body;
    try {
        await db_1.default
            .insert(schema_1.userAiSettings)
            .values({
            userId: req.userId,
            providerType: provider_type,
            apiKeyEnc: api_key,
            modelName: model_name || null,
            baseUrl: base_url || null,
            isConfigured: is_configured ?? false,
        })
            .onConflictDoUpdate({
            target: schema_1.userAiSettings.userId,
            set: {
                providerType: provider_type,
                apiKeyEnc: api_key,
                modelName: model_name || null,
                baseUrl: base_url || null,
                isConfigured: is_configured ?? false,
            },
        });
        const rows = await db_1.default
            .select(SETTINGS_SELECTION)
            .from(schema_1.userAiSettings)
            .where((0, drizzle_orm_1.eq)(schema_1.userAiSettings.userId, req.userId));
        return res.status(200).json(mapSettings(rows[0]));
    }
    catch (error) {
        console.error('Error saving AI settings:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
router.delete('/', authMiddleware_1.default, aiSettings_1.deleteAiSettingsValidation, async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const result = await db_1.default
            .delete(schema_1.userAiSettings)
            .where((0, drizzle_orm_1.eq)(schema_1.userAiSettings.userId, req.userId))
            .returning({ id: schema_1.userAiSettings.id });
        if (result.length === 0) {
            return res.status(404).json({ error: 'AI settings not found' });
        }
        return res.status(200).json({ message: 'AI settings deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting AI settings:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
