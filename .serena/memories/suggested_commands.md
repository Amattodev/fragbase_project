# Suggested Commands

## Development Commands

- `npm run dev` - Start development server
- `npm run dev:db` - Initialize development database
- `npm run dev:setup` - Setup database and start dev server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Database Commands

- `npm run db:generate` - Generate Drizzle migrations
- `npm run db:push` - Push migrations to database
- `npx drizzle-kit migrate` - Run migrations

## Deployment Commands

- `npm run deploy` - Build and deploy to Cloudflare
- `npm run preview` - Build and preview deployment
- `npm run cf-typegen` - Generate Cloudflare types

## Development Database

- Local SQLite database: `./dev.db`
- Development database is automatically created with `npm run dev:db`

## When Task is Completed

1. Run `npm run lint` to check for linting errors
2. Run `npm run build` to ensure the build succeeds
3. Test functionality manually with `npm run dev`
4. Check database migrations if schema changes were made
