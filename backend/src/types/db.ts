import { RowDataPacket } from 'mysql2';

export interface UserRow extends RowDataPacket {
    id: number;
    username: string;
    email: string;
    password_hash: string;
    role: string;
    display_name: string | null;
    bio: string | null;
    avatar_url: string | null;
    registered_at: Date;
}

export interface PublicUserRow extends RowDataPacket {
    id: number;
    username: string;
    email: string;
    role: string;
    display_name: string | null;
    bio: string | null;
    avatar_url: string | null;
    registered_at: Date;
}

export interface CollectionRow extends RowDataPacket {
    id: number;
    user_id: number;
    name: string;
    description: string | null;
    created_at: Date;
}

export interface CollectionWithCountRow extends RowDataPacket {
    id: number;
    name: string;
    description: string | null;
    created_at: Date;
    snippet_count: number;
}

export interface SnippetRow extends RowDataPacket {
    id: number;
    user_id: number;
    collection_id: number | null;
    title: string;
    description: string | null;
    code: string;
    language: string;
    visibility: string;
    share_token: string | null;
    created_at: Date;
    updated_at: Date;
}

export interface SnippetWithTagsRow extends SnippetRow {
    tags: string | null;
}

export interface TagRow extends RowDataPacket {
    id: number;
    name: string;
}

export interface SnippetTagRow extends RowDataPacket {
    snippet_id: number;
    tag_id: number;
}

export interface SnippetVersionRow extends RowDataPacket {
    id: number;
    snippet_id: number;
    code: string;
    version_number: number;
    change_note: string | null;
    created_at: Date;
}

export interface SnippetVersionListRow extends RowDataPacket {
    id: number;
    version_number: number;
    change_note: string | null;
    created_at: Date;
}

export interface MaxVersionRow extends RowDataPacket {
    maxVer: number | null;
}

export interface CommentRow extends RowDataPacket {
    id: number;
    user_id: number;
    snippet_id: number;
    content: string;
    created_at: Date;
    updated_at: Date;
}

export interface AiSettingsRow extends RowDataPacket {
    id: number;
    user_id: number;
    provider_type: string;
    model_name: string | null;
    base_url: string | null;
    is_configured: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface IdRow extends RowDataPacket {
    id: number;
}

export interface CodeRow extends RowDataPacket {
    code: string;
}
