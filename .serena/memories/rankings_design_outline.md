Design outline before implementation:
- DB schema: add tables ranking_snapshots(id, kind, metric, period, window_start, window_end, computed_at); ranking_entries(id, snapshot_id FK, rank, post_id NULL, user_id NULL, likes_count, posts_count, comments_count). Unique index on (kind, metric, period, window_end). Indices on ranking_entries (snapshot_id, rank).
- Indexes for source tables: post_likes(created_at, post_id), post_comments(created_at, post_id), posts(status, created_at), posts(user_id, status), post_likes(post_id), post_comments(post_id).
- Aggregation windows use ms epoch; use posts.createdAt as publish time (until publishedAt exists).
- Batch: weekly at Mon 00:10 JST compute snapshots for weekly+alltime; store top N=200 entries. Fallback: admin endpoint /api/internal/rankings/rebuild protected.
- API: GET /api/rankings/articles?period=weekly|alltime&limit=&offset=. GET /api/rankings/users?period=..&metric=posts|comments|likes&limit=&offset=. Returns windowStart/windowEnd/computedAt.
- UI: /rankings page with tabs (記事/ユーザー) and toggles (Weekly/AllTime), show week label, row-click navigations to /articles/[id] and /profile/[username]. Empty states.
- Tiebreakers: articles -> publish time desc then id asc; users -> metric-specific latest event time desc then id asc.
- Visibility guard: Join to posts/users at read-time and filter status=published; omit missing/deleted.
- Future: consider adding posts.publishedAt and soft-delete flags; move to materialized rollups if scale grows.