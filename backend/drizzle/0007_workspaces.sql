CREATE TYPE "public"."workspace_role" AS ENUM('owner', 'editor', 'viewer');--> statement-breakpoint
CREATE TABLE "snippet_project" (
	"snippet_id" integer PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_invitation" (
	"workspace_id" integer NOT NULL,
	"invited_user_id" integer NOT NULL,
	"invited_by_user_id" integer NOT NULL,
	"role" "workspace_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "workspace_invitation_workspace_id_invited_user_id_pk" PRIMARY KEY("workspace_id","invited_user_id")
);
--> statement-breakpoint
CREATE TABLE "workspace_member" (
	"workspace_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"role" "workspace_role" NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workspace_member_workspace_id_user_id_pk" PRIMARY KEY("workspace_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "snippet" DROP CONSTRAINT "snippet_project_id_project_id_fk";
--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "workspace_id" integer;--> statement-breakpoint
ALTER TABLE "snippet" ADD COLUMN "workspace_id" integer;--> statement-breakpoint
DO $$
DECLARE
    existing_project RECORD;
    new_workspace_id INTEGER;
BEGIN
    IF EXISTS (
        SELECT p.id FROM public.project p
        LEFT JOIN public.project_member m ON m.project_id = p.id AND m.role = 'owner'
        GROUP BY p.id HAVING count(m.user_id) <> 1
    ) THEN
        RAISE EXCEPTION 'Every existing project must have exactly one owner before migration'
            USING ERRCODE = '23514';
    END IF;

    FOR existing_project IN SELECT id, name, created_at FROM public.project ORDER BY id LOOP
        INSERT INTO public.workspace (name, created_at)
        VALUES (existing_project.name, existing_project.created_at)
        RETURNING id INTO new_workspace_id;

        UPDATE public.project SET workspace_id = new_workspace_id WHERE id = existing_project.id;
    END LOOP;

    INSERT INTO public.workspace_member (workspace_id, user_id, role, joined_at)
    SELECT p.workspace_id, m.user_id, m.role::text::public.workspace_role, m.joined_at
    FROM public.project_member m JOIN public.project p ON p.id = m.project_id;

    UPDATE public.snippet s SET workspace_id = p.workspace_id
    FROM public.project p WHERE s.project_id = p.id;

    INSERT INTO public.snippet_project (snippet_id, project_id)
    SELECT id, project_id FROM public.snippet WHERE project_id IS NOT NULL;
END;
$$;
--> statement-breakpoint
ALTER TABLE "project" ALTER COLUMN "workspace_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "snippet_project" ADD CONSTRAINT "snippet_project_snippet_id_snippet_id_fk" FOREIGN KEY ("snippet_id") REFERENCES "public"."snippet"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "snippet_project" ADD CONSTRAINT "snippet_project_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_invitation" ADD CONSTRAINT "workspace_invitation_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_invitation" ADD CONSTRAINT "workspace_invitation_invited_user_id_users_id_fk" FOREIGN KEY ("invited_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_invitation" ADD CONSTRAINT "workspace_invitation_invited_by_user_id_users_id_fk" FOREIGN KEY ("invited_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_member" ADD CONSTRAINT "workspace_member_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_member" ADD CONSTRAINT "workspace_member_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "snippet_project_project_id_idx" ON "snippet_project" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "workspace_invitation_invited_user_id_idx" ON "workspace_invitation" USING btree ("invited_user_id");--> statement-breakpoint
CREATE INDEX "workspace_invitation_invited_by_user_id_idx" ON "workspace_invitation" USING btree ("invited_by_user_id");--> statement-breakpoint
CREATE INDEX "workspace_member_user_id_idx" ON "workspace_member" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_member_owner_unique" ON "workspace_member" USING btree ("workspace_id") WHERE "workspace_member"."role" = 'owner';--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "snippet" ADD CONSTRAINT "snippet_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "project_workspace_id_idx" ON "project" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "project_user_id_idx" ON "project" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "snippet_workspace_id_idx" ON "snippet" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "snippet_user_id_idx" ON "snippet" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "snippet" DROP COLUMN "project_id";
