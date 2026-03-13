# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run setup        # First-time setup: install deps, generate Prisma client, run migrations
npm run dev          # Start dev server with Turbopack on http://localhost:3000
npm run build        # Production build
npm run lint         # Run ESLint
npm test             # Run Vitest tests
npm run db:reset     # Force reset SQLite database
```

The dev server requires a Node.js compatibility shim (`node-compat.cjs`) and is invoked with `NODE_OPTIONS='--require ./node-compat.cjs'`.

To run a single test file:
```bash
npx vitest run src/components/chat/__tests__/ChatInterface.test.tsx
```

## Architecture

UIGen is a Next.js 15 App Router application that lets users generate React components via AI chat, with live preview and code editing.

### Key Data Flow

1. User sends a message → `POST /api/chat` ([src/app/api/chat/route.ts](src/app/api/chat/route.ts))
2. Route streams a response using Vercel AI SDK's `streamText()` with `claude-haiku-4-5`
3. The AI uses two tools to write code: `str_replace_editor` and `file_manager`
4. Generated files are stored in an in-memory `VirtualFileSystem` ([src/lib/file-system.ts](src/lib/file-system.ts))
5. On completion, the serialized VFS is persisted to the Prisma `Project` record
6. The preview iframe re-renders using the updated virtual files

### Virtual File System

The `VirtualFileSystem` class ([src/lib/file-system.ts](src/lib/file-system.ts)) is an in-memory store — no disk writes for user-generated code. It exposes methods for CRUD operations plus text-editor operations (`viewFile`, `replaceInFile`, `insertInFile`) used by the AI tools. Generated components must have `/App.jsx` as the entry point.

### AI Provider

[src/lib/provider.ts](src/lib/provider.ts) selects between:
- **Anthropic** (`claude-haiku-4-5`) when `ANTHROPIC_API_KEY` is set in `.env`
- **MockLanguageModel** — returns static example components when no API key is present

### Authentication

JWT-based sessions (7-day expiry) via `jose`, passwords hashed with `bcrypt`. Session logic is in [src/lib/auth.ts](src/lib/auth.ts). Server actions in [src/actions/index.ts](src/actions/index.ts) handle signUp/signIn/signOut/getUser. The middleware ([src/middleware.ts](src/middleware.ts)) protects `/api/projects` and `/api/filesystem` routes.

### Database

Prisma with SQLite (`prisma/dev.db`). Two models:
- `User` — email + hashed password
- `Project` — belongs to User, stores serialized VFS as JSON, plus title and timestamps

After schema changes: `npx prisma migrate dev` and `npx prisma generate`.

### UI Layout

[src/app/main-content.tsx](src/app/main-content.tsx) renders three resizable panels (via `react-resizable-panels`):
- **Chat** — [src/components/chat/](src/components/chat/)
- **Preview** — [src/components/preview/](src/components/preview/) (iframe-based live render)
- **Code Editor** — [src/components/editor/](src/components/editor/) (Monaco editor + file tree)

State is managed via two React contexts: `FileSystemContext` and `ChatContext` in [src/lib/contexts/](src/lib/contexts/).

### AI System Prompt

[src/lib/prompts/generation.tsx](src/lib/prompts/generation.tsx) defines how Claude generates components: React + Tailwind CSS, `@/` import alias, `/App.jsx` as entry point.
