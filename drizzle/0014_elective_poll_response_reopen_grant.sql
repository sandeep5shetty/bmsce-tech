-- Links a response back to the specific reopen grant (and its remarks) that
-- authorized it, when the poll was closed at submission time. Null for every
-- ordinary submission to an open poll.
ALTER TABLE "elective_poll_response" ADD COLUMN "reopen_grant_id" text;
--> statement-breakpoint
ALTER TABLE "elective_poll_response" ADD CONSTRAINT "elective_poll_response_reopen_grant_id_elective_poll_reopen_grant_id_fk" FOREIGN KEY ("reopen_grant_id") REFERENCES "public"."elective_poll_reopen_grant"("id") ON DELETE set null ON UPDATE no action;
