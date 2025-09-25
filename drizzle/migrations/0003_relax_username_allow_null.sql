-- NO-OP migration for D1 stability
-- Originally: relax `user.username` to allow NULLs via table swap.
-- On Cloudflare D1, table swap can fail with FK constraints during migrations.
-- We keep NOT NULL + default '' and handle backfill at the application layer.
SELECT 1;
