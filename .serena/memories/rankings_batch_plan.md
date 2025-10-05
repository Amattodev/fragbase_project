Weekly batch (Mon 00:10 JST):
1) Compute window {start,end} for previous week (JST).
2) Build snapshots for: Articles(weekly), Users(posts|comments|likes weekly), Articles(alltime), Users(alltime metrics).
3) For each: compute top N and persist entries with rank.
4) Keep idempotent by upserting snapshot on (kind, metric, period, window_end) and replacing entries.
5) Expose internal endpoint /api/internal/rankings/rebuild gated by secret.
6) Optional: Cloudflare Cron (functions/scheduled.ts) to call rebuild on schedule.