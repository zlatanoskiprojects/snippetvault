CREATE TABLE "email_change_rate_limit" (
	"user_id" integer PRIMARY KEY NOT NULL,
	"window_started_at" timestamp with time zone NOT NULL,
	"request_count" integer NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pending_email_change" DROP CONSTRAINT "pending_email_change_user_new_email_unique";--> statement-breakpoint
DELETE FROM "pending_email_change" AS older
USING "pending_email_change" AS newer
WHERE older."user_id" = newer."user_id"
  AND (
    older."created_at" < newer."created_at"
    OR (older."created_at" = newer."created_at" AND older."id" < newer."id")
  );--> statement-breakpoint
ALTER TABLE "email_change_rate_limit" ADD CONSTRAINT "email_change_rate_limit_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pending_email_change" ADD CONSTRAINT "pending_email_change_user_id_unique" UNIQUE("user_id");
