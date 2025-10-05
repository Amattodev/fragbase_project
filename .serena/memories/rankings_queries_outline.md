Aggregation (examples, SQLite/Drizzle):
- Articles weekly: SELECT p.id, COUNT(l.id) AS likes FROM posts p LEFT JOIN post_likes l ON l.post_id=p.id AND l.created_at BETWEEN ? AND ? WHERE p.status='published' AND p.created_at BETWEEN ? AND ? GROUP BY p.id ORDER BY likes DESC, p.created_at DESC, p.id ASC LIMIT ?;
- Articles alltime: similar but no p.created_at window and no l.created_at filter.
- Users weekly posts: SELECT p.user_id, COUNT(*) FROM posts p WHERE p.status='published' AND p.created_at BETWEEN ? AND ? GROUP BY p.user_id;
- Users weekly comments: SELECT p.user_id, COUNT(c.id) FROM post_comments c JOIN posts p ON p.id=c.post_id AND p.status='published' WHERE c.created_at BETWEEN ? AND ? GROUP BY p.user_id;
- Users weekly likes: SELECT p.user_id, COUNT(l.id) FROM post_likes l JOIN posts p ON p.id=l.post_id AND p.status='published' WHERE l.created_at BETWEEN ? AND ? GROUP BY p.user_id;
Ties: order by latest event time for each metric desc, then id asc.