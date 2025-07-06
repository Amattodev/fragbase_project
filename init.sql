DROP TABLE IF EXISTS posts;

CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    content TEXT
);

INSERT INTO posts (id, title, content) VALUES
(1, 'Hello', 'World'),
(2, 'Good Morning', 'World'),
(3, 'Good Afternoon', 'World');
