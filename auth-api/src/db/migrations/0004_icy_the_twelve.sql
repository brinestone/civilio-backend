ALTER TABLE "session" DROP CONSTRAINT "session_impersonatedBy_user_id_fk";
--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_impersonatedBy_user_id_fk" FOREIGN KEY ("impersonatedBy") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;