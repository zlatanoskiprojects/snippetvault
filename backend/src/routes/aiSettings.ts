import { Router, Request, Response } from 'express';
import { createCipheriv, randomBytes, scryptSync } from 'crypto';
import { eq } from 'drizzle-orm';
import db from '../lib/db';
import { userAiSettings } from '../db/schema';
import authMiddleware from '../middleware/authMiddleware';
import { validationResult } from 'express-validator';
import { createAiSettingsValidation, updateAiSettingsValidation, deleteAiSettingsValidation } from '../validators/aiSettings';

const router = Router();

function encryptApiKey(apiKey: string): string {
    const secret = process.env.AI_KEY_SECRET;
    if (!secret) {
        throw new Error('AI_KEY_SECRET is not set');
    }
    const key = scryptSync(secret, 'snippetvault-ai-key', 32);
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(apiKey, 'utf8'), cipher.final()]);
    return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64');
}

const SETTINGS_SELECTION = {
    id: userAiSettings.id,
    userId: userAiSettings.userId,
    providerType: userAiSettings.providerType,
    modelName: userAiSettings.modelName,
    baseUrl: userAiSettings.baseUrl,
    isConfigured: userAiSettings.isConfigured,
    createdAt: userAiSettings.createdAt,
    updatedAt: userAiSettings.updatedAt,
};

const mapSettings = (s: {
    id: number;
    userId: number;
    providerType: string;
    modelName: string | null;
    baseUrl: string | null;
    isConfigured: boolean;
    createdAt: Date;
    updatedAt: Date;
}) => ({
    id: s.id,
    user_id: s.userId,
    provider_type: s.providerType,
    model_name: s.modelName,
    base_url: s.baseUrl,
    is_configured: s.isConfigured,
    created_at: s.createdAt,
    updated_at: s.updatedAt,
});

router.get('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        const rows = await db
            .select(SETTINGS_SELECTION)
            .from(userAiSettings)
            .where(eq(userAiSettings.userId, req.userId as number));
        if (rows.length === 0) {
            return res.status(404).json({ error: 'AI settings not found' });
        }
        return res.status(200).json(mapSettings(rows[0]));
    } catch (error) {
        console.error('Error fetching AI settings:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/', authMiddleware, createAiSettingsValidation, async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { api_key, provider_type, model_name, base_url, is_configured } = req.body;

    try {
        const apiKeyEnc = encryptApiKey(api_key);
        await db
            .insert(userAiSettings)
            .values({
                userId: req.userId as number,
                providerType: provider_type,
                apiKeyEnc,
                modelName: model_name || null,
                baseUrl: base_url || null,
                isConfigured: is_configured ?? false,
            })
            .onConflictDoUpdate({
                target: userAiSettings.userId,
                set: {
                    providerType: provider_type,
                    apiKeyEnc,
                    modelName: model_name || null,
                    baseUrl: base_url || null,
                    isConfigured: is_configured ?? false,
                },
            });

        const rows = await db
            .select(SETTINGS_SELECTION)
            .from(userAiSettings)
            .where(eq(userAiSettings.userId, req.userId as number));
        return res.status(200).json(mapSettings(rows[0]));
    } catch (error) {
        console.error('Error saving AI settings:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/', authMiddleware, deleteAiSettingsValidation, async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const result = await db
            .delete(userAiSettings)
            .where(eq(userAiSettings.userId, req.userId as number))
            .returning({ id: userAiSettings.id });
        if (result.length === 0) {
            return res.status(404).json({ error: 'AI settings not found' });
        }
        return res.status(200).json({ message: 'AI settings deleted successfully' });
    } catch (error) {
        console.error('Error deleting AI settings:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
