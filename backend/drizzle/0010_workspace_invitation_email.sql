CREATE TYPE "public"."invitation_status" AS ENUM('pending', 'accepted', 'rejected', 'cancelled');--> statement-breakpoint
ALTER TABLE "workspace_invitation" DROP CONSTRAINT "workspace_invitation_invited_user_id_users_id_fk";
--> statement-breakpoint
DROP INDEX "workspace_invitation_invited_user_id_idx";--> statement-breakpoint
ALTER TABLE "workspace_invitation" DROP CONSTRAINT "workspace_invitation_workspace_id_invited_user_id_pk";--> statement-breakpoint
ALTER TABLE "workspace_invitation" ADD COLUMN "id" serial PRIMARY KEY NOT NULL;--> statement-breakpoint
ALTER TABLE "workspace_invitation" ADD COLUMN "email" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "workspace_invitation" ADD COLUMN "status" "invitation_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "workspace_invitation" ADD COLUMN "token_hash" varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE "workspace_invitation" ADD COLUMN "accepted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "workspace_invitation" ADD CONSTRAINT "workspace_invitation_token_hash_unique" UNIQUE("token_hash");--> statement-breakpoint
CREATE INDEX "workspace_invitation_email_idx" ON "workspace_invitation" USING btree ("email");--> statement-breakpoint
CREATE INDEX "workspace_invitation_workspace_id_idx" ON "workspace_invitation" USING btree ("workspace_id");--> statement-breakpoint
ALTER TABLE "workspace_invitation" DROP COLUMN "invited_user_id";
