# Current Project Status

## Git Status (at conversation start)

- Current branch: `feature/post-article`
- Main branch: `develop`
- Modified files:
  - `lib/markdown.ts`
  - `server/routes/posts.ts`

## Recent Commits

- APIの作成とディレクトリの修正
- cloudflareimageにアップする画像url作成
- スラッグ作成
- 型エラー解消
- パッケージを追加

## Current Features

- Game settings posting and viewing system
- Comments and likes functionality
- Game-specific configuration support (APEX, VALORANT, OVERWATCH2)
- Filter and pagination system
- Responsive UI with dark theme

## In Progress

- Article/blog posting functionality implementation
- Markdown processing and sanitization
- Image upload integration with Cloudflare Images
- Draft and publishing workflow

## Database Schema

Current tables:

- `settings` - Game settings posts
- `comments` - Comments on settings
- `likes` - User likes on settings

Missing tables for article feature:

- `posts` - Article posts
- `tags` - Article tags
- `post_tags` - Many-to-many relationship
