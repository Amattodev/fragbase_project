# FragBase Project Overview

## Purpose
FragBase is a web application for sharing FPS game settings and configurations. Users can post their game settings (sensitivity, DPI, etc.) and view/comment on others' configurations for games like APEX, VALORANT, and OVERWATCH2.

## Tech Stack
- **Frontend**: Next.js 14 (App Router) + React + TypeScript
- **Backend**: Cloudflare Workers + Hono framework
- **Database**: Cloudflare D1 (production) / SQLite (development) + Drizzle ORM
- **Styling**: Tailwind CSS + shadcn/ui components
- **Deployment**: OpenNext Cloudflare

## Project Structure
- `app/` - Next.js App Router pages and components
- `lib/` - Utility functions and database setup
- `db/` - Database schema and migrations
- `components/` - Reusable UI components (shadcn/ui based)
- `constants/` - Static data (game configs, options)
- `types/` - TypeScript type definitions
- `server/routes/` - Hono API routes (currently in progress)

## Current Status
The project currently supports:
- Game settings posting and viewing
- Comments and likes system
- Filtering by game, role, device, etc.
- Support for APEX, VALORANT, OVERWATCH2

Working on adding article/blog posting functionality.