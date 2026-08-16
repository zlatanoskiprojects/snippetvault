CREATE TABLE "pending_email_change" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"old_email" varchar(255) NOT NULL,
	"new_email" varchar(255) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pending_email_change_user_new_email_unique" UNIQUE("user_id","new_email")
);
--> statement-breakpoint
ALTER TABLE "pending_email_change" ADD CONSTRAINT "pending_email_change_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;