UPDATE "workspace_invitation" SET "status" = 'cancelled' WHERE "status" = 'pending' AND "expires_at" <= now();
--> statement-breakpoint
UPDATE "workspace_invitation" SET "status" = 'cancelled' WHERE "id" IN (SELECT "id" FROM (SELECT "id", row_number() OVER (PARTITION BY "workspace_id", "email" ORDER BY "created_at" DESC, "id" DESC) AS rn FROM "workspace_invitation" WHERE "status" = 'pending') t WHERE t.rn > 1);
--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_invitation_active_unique" ON "workspace_invitation" USING btree ("workspace_id","email") WHERE "workspace_invitation"."status" = 'pending';
