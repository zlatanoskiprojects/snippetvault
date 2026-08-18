export const AUTH_FRESH_SESSION_SECONDS = 5 * 60;

export function isSessionFresh(
    sessionCreatedAt: Date | string,
    now = Date.now(),
): boolean {
    const createdAt = new Date(sessionCreatedAt).getTime();
    const age = now - createdAt;

    return Number.isFinite(createdAt) &&
        age >= 0 &&
        age < AUTH_FRESH_SESSION_SECONDS * 1000;
}
