export const SUPPORTED_LANGUAGES = [
    'JavaScript',
    'TypeScript',
    'Python',
    'Java',
    'C++',
    'Go',
    'Rust',
    'SQL',
] as const;

export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

