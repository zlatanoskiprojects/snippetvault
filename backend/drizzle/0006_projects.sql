CREATE TYPE "public"."project_role" AS ENUM('owner', 'editor', 'viewer');--> statement-breakpoint
CREATE TABLE "project_invitation" (
	"project_id" integer NOT NULL,
	"invited_user_id" integer NOT NULL,
	"role" "project_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_invitation_project_id_invited_user_id_pk" PRIMARY KEY("project_id","invited_user_id"),
	CONSTRAINT "project_invitation_role_check" CHECK ("project_invitation"."role" in ('editor', 'viewer'))
);
--> statement-breakpoint
CREATE TABLE "project_member" (
	"project_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"role" "project_role" NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_member_project_id_user_id_pk" PRIMARY KEY("project_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "collection" RENAME TO "project";--> statement-breakpoint
ALTER TABLE "snippet" RENAME COLUMN "collection_id" TO "project_id";--> statement-breakpoint
INSERT INTO "project_member" ("project_id", "user_id", "role") SELECT "id", "user_id", 'owner' FROM "project";--> statement-breakpoint
ALTER TABLE "project" DROP CONSTRAINT "collection_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "snippet" DROP CONSTRAINT "snippet_collection_id_collection_id_fk";
--> statement-breakpoint
ALTER TABLE "project_invitation" ADD CONSTRAINT "project_invitation_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_invitation" ADD CONSTRAINT "project_invitation_invited_user_id_users_id_fk" FOREIGN KEY ("invited_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_member" ADD CONSTRAINT "project_member_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_member" ADD CONSTRAINT "project_member_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "project_invitation_invited_user_id_idx" ON "project_invitation" USING btree ("invited_user_id");--> statement-breakpoint
CREATE INDEX "project_member_user_id_idx" ON "project_member" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "snippet" ADD CONSTRAINT "snippet_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE set null ON UPDATE no action;
