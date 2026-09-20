DO $$
DECLARE
    existing_user RECORD;
    default_workspace_id INTEGER;
BEGIN
    FOR existing_user IN
        SELECT u.id, u.username
        FROM public.users u
        WHERE EXISTS (
            SELECT 1 FROM public.snippet s
            WHERE s.user_id = u.id AND s.workspace_id IS NULL
        ) OR NOT EXISTS (
            SELECT 1 FROM public.workspace_member wm
            WHERE wm.user_id = u.id
        )
        ORDER BY u.id
    LOOP
        INSERT INTO public.workspace (name)
        VALUES (left(existing_user.username || '''s Workspace', 255))
        RETURNING id INTO default_workspace_id;

        INSERT INTO public.workspace_member (workspace_id, user_id, role)
        VALUES (default_workspace_id, existing_user.id, 'owner');

        UPDATE public.snippet
        SET workspace_id = default_workspace_id
        WHERE user_id = existing_user.id AND workspace_id IS NULL;
    END LOOP;
END;
$$;
--> statement-breakpoint
ALTER TABLE "snippet" ALTER COLUMN "workspace_id" SET NOT NULL;
