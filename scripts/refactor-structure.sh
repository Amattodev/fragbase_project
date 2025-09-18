#!/usr/bin/env bash
set -euo pipefail

# Create scaffolding for the agreed structure. No file moves yet.

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "Scaffolding directories..."
mkdir -p components/ui components/forms components/feedback
mkdir -p lib/hooks lib/utils lib/services lib/server lib/client
mkdir -p constants types docs

# Keep empty folders in git
touch components/ui/.gitkeep components/forms/.gitkeep components/feedback/.gitkeep
touch lib/hooks/.gitkeep lib/utils/.gitkeep lib/services/.gitkeep lib/server/.gitkeep lib/client/.gitkeep
touch constants/.gitkeep types/.gitkeep

cat <<'TIP'

Next steps (manual):
1) Move shared UI into components/* and route-specific UI into app/(group)/_components/*
2) Extract data fetching to lib/services/* and add `import 'server-only'` for server-only modules
3) Add/merge tsconfig paths: { "baseUrl": ".", "paths": { "@/*": ["./*"] } }
4) Configure ESLint import/order and no-restricted-imports rules
5) Run: npm run lint && npm run build

TIP

echo "Done. Created basic scaffolding and .gitkeep files."

