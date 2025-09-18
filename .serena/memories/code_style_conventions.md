# Code Style and Conventions

## Code Style

- **Language**: TypeScript throughout
- **Formatting**: ESLint with Next.js and TypeScript rules
- **Components**: React functional components with hooks
- **Styling**: Tailwind CSS with utility classes
- **UI Components**: shadcn/ui based components

## Naming Conventions

- **Files**: kebab-case (e.g., `game-fields.ts`)
- **Components**: PascalCase (e.g., `SettingCard.tsx`)
- **Variables/Functions**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Types/Interfaces**: PascalCase

## Directory Structure

- Components in `/components/` with UI components in `/components/ui/`
- API routes using Hono in `/app/api/[[...route]]/route.ts`
- Types in `/types/` directory
- Constants in `/constants/` directory
- Database schema in `/db/schema.ts`
- Utils in `/lib/` directory

## Database Conventions

- Use Drizzle ORM with proper type inference
- Schema definitions in `/db/schema.ts`
- Migration files in `/drizzle/migrations/`
- Development uses SQLite, production uses Cloudflare D1

## Comments

- Japanese comments are used throughout the codebase
- TODOs are marked with `// TODO:` prefix
- Code is documented inline where needed

## Component Patterns

- Use shadcn/ui components as base
- Custom styling with Tailwind utility classes
- Dark theme with custom colors (#1F1F1F, #2B2B2B, #F5F5F5, #7DB7E8)
- Responsive design patterns
