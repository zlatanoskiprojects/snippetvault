export const ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://localhost:3000',
    'https://snippetvault.me',
    'https://www.snippetvault.me',
    process.env.CLIENT_URL,
].filter((origin): origin is string => Boolean(origin));
