export interface User {
    id: number;
    username: string;
    email: string;
    role: string;
    display_name: string | null;
    bio: string | null;
    avatar_url: string | null;
    registered_at: string;
    has_password: boolean;
    oauth_providers: Array<'google' | 'github'>;
}

export interface Project {
    id: number;
    user_id: number;
    name: string;
    description: string | null;
    created_at: string;
}

export interface Snippet {
    id: number;
    user_id: number;
    project_id: number | null;
    title: string;
    description: string | null;
    code: string;
    language: string;
    visibility: string;
    share_token: string | null;
    created_at: string;
    updated_at: string;
    tags?: string[];
}

export interface SnippetVersion {
    id: number;
    snippet_id: number;
    code: string;
    version_number: number;
    change_note: string | null;
    created_at: string;
}

export interface Tag {
    id: number;
    name: string;
}

export interface Comment {
    id: number;
    user_id: number;
    snippet_id: number;
    content: string;
    created_at: string;
    updated_at: string;
}

export interface SharedSnippet {
    id: number;
    title: string;
    description: string | null;
    code: string;
    language: string;
    tags: string[];
    created_at: string;
    updated_at: string;
    owner_name: string;
}

export interface AiSettings {
    id: number;
    user_id: number;
    provider_type: string;
    model_name: string | null;
    base_url: string | null;
    is_configured: boolean;
    created_at: string;
    updated_at: string;
}
