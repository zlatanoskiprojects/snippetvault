import { createHash, randomBytes } from 'crypto';

export function generateInvitationToken() {
    const token = randomBytes(32).toString('hex');

    const tokenHash = createHash('sha256')
        .update(token)
        .digest('hex');

    return {
        token,
        tokenHash,
    };
}

export function hashInvitationToken(token: string) {
    return createHash('sha256')
        .update(token)
        .digest('hex');
}