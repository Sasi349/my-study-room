# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

My Study Room — a mobile-first PWA for organizing learning materials in a hierarchical structure: **Category → Subject → Room → Content** (notes, links, files, images). Also includes streak tracking and syllabus progress tracking. Designed for single-digit users on free-tier infrastructure.

## Commands

```bash
npm run dev          # Start dev server (localhost:3000, uses Turbopack)
npm run build        # prisma generate && next build
npm start            # Production server
npm run lint         # ESLint
npm run seed         # Seed database (node prisma/seed.mjs)
npm run db:push      # Push schema changes to database
npm run db:studio    # Open Prisma Studio
```

## Tech Stack

- **Framework:** Next.js 16 (App Router) with React 19, TypeScript
- **Styling:** Tailwind CSS 4.x (utility-first, dark mode via next-themes)
- **Database:** Turso (LibSQL/SQLite) via Prisma 7.5 with `@prisma/adapter-libsql`
- **Auth:** NextAuth v5 beta — JWT sessions, two providers: Credentials (bcrypt) and Passcode (4-digit PIN)
- **File Storage:** Cloudflare R2 via AWS S3 SDK
- **Drag & Drop:** @dnd-kit for reordering at all hierarchy levels
- **PWA:** Service worker with network-first caching, installable on mobile

## Architecture

### Path alias
`@/*` maps to `./src/*`

### App structure (`src/app/`)
- Pages use nested dynamic routes: `/categories/[categoryId]/[subjectId]/[roomId]`
- `/tracker/[syllabusId]` for syllabus tracking
- `/login` — unauthenticated entry point
- `/` redirects to `/categories`

### API routes (`src/app/api/`)
All REST endpoints. Protected by middleware (except `/api/auth`, `/api/seed`). Each resource has its own route folder with `route.ts`. File uploads use multipart form data.

Key patterns:
- All API handlers get the authenticated user via `auth()` from `@/lib/auth`
- Resources are scoped to the authenticated user (user ownership enforced at query level)
- Cascade deletes follow the hierarchy

### Database (`prisma/schema.prisma`)
- Prisma client generates to `src/generated/prisma/`
- Prisma config with LibSQL adapter is in `prisma.config.ts`
- Models use `order` fields (Int) for drag-drop reordering
- `Streak` → `StreakLog` uses unique constraint on (streakId, date)
- Tracker system: `Syllabus` → `TrackerTopic` → `TrackerItem`, with `TrackerMember` and `TrackerProgress` for per-member completion

### Auth (`src/lib/auth.ts`, `src/middleware.ts`)
- Middleware checks `authjs.session-token` cookie, redirects to `/login` if missing
- JWT callbacks inject `user.id` into token and session
- `bcryptjs` is in `serverExternalPackages` in next.config.ts (server-only)

### File storage (`src/lib/r2.ts`)
- S3Client configured for Cloudflare R2
- Files uploaded to bucket `learning-rooms` under `uploads/images/` or `uploads/files/`
- Public URL served from R2 public domain
- File metadata (name, path, size, mimeType) stored in Prisma

### Components (`src/components/`)
- `ui/` contains reusable UI: Modal, ConfirmDialog, SortableList, StreakTracker, Header, BottomNav, ThemeToggle, EmptyState
- `AuthProvider.tsx` wraps NextAuth session
- `ServiceWorkerRegister.tsx` registers the PWA service worker

### Hooks (`src/hooks/`)
- `useLongPress.ts` — long-press gesture detection for mobile interactions

## Environment Variables

Required in `.env`: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `AUTH_SECRET`, `AUTH_URL`, `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`

## Key Database Models & Relationships

```
User (root)
├─ Category (many)
│  ├─ Subject (many)
│  │  └─ Room (many)
│  │     ├─ Note (many)
│  │     ├─ Link (many)
│  │     ├─ File (many)
│  │     └─ Image (many)
│  └─ CategoryReorder (history)
├─ Streak (many)
│  └─ StreakLog (many)
├─ Syllabus (many)
│  ├─ TrackerTopic (many)
│  │  └─ TrackerItem (many)
│  ├─ TrackerMember (many)
│  └─ TrackerProgress (many)
└─ Profile (1) — stores settings like streakLabel
```

**Key constraints:**
- All resources scoped to `userId` (enforced at query level)
- `order` field (Int) on Category, Subject, Room, and tracker items for drag-drop
- `(streakId, date)` unique on StreakLog
- `(trackerId, memberId, itemId)` unique on TrackerProgress

## Quick File Reference

| Purpose | Location |
|---------|----------|
| User authentication setup | `src/lib/auth.ts`, `src/middleware.ts` |
| Prisma models | `prisma/schema.prisma` |
| Generated Prisma client | `src/generated/prisma/` (auto-generated) |
| R2/S3 uploads | `src/lib/r2.ts` |
| API route: categories | `src/app/api/categories/` |
| API route: subjects | `src/app/api/subjects/` |
| API route: rooms | `src/app/api/rooms/` |
| API route: content (notes/links/files) | `src/app/api/[content-type]/` |
| API route: reordering | `src/app/api/reorder/route.ts` |
| API route: tracker | `src/app/api/tracker/` |
| Page: main categories view | `src/app/categories/page.tsx` |
| Page: tracker view | `src/app/tracker/[syllabusId]/page.tsx` |
| Reusable UI components | `src/components/ui/` |
| Custom hooks | `src/hooks/` |
| Service Worker | `public/sw.js` |

## Common Code Patterns

### Getting authenticated user
```ts
import { auth } from '@/lib/auth';

const user = await auth();
if (!user?.id) throw new Error('Unauthorized');
```

### API response pattern
```ts
return Response.json({ success: true, data: result }, { status: 200 });
return Response.json({ error: 'message' }, { status: 400 });
```

### Database query with user scoping
```ts
const item = await prisma.category.findUnique({
  where: { id: categoryId, userId: user.id }
});
```

### File upload to R2
```ts
import { s3Client } from '@/lib/r2';
const command = new PutObjectCommand({ Bucket, Key, Body });
await s3Client.send(command);
```

### Cascade delete
Follow the hierarchy: delete children before parent. Example:
```ts
// Delete room items first
await prisma.note.deleteMany({ where: { roomId } });
// Then delete room
await prisma.room.delete({ where: { id: roomId } });
```

### Reordering (drag-drop)
Update `order` field on items in POST `/api/reorder`:
```ts
// Batch update order values for reordered items
await prisma.category.updateMany({
  data: items.map(item => ({
    where: { id: item.id },
    data: { order: item.order }
  }))
});
```

## Key Dependencies & Purpose

| Package | Purpose |
|---------|---------|
| `next` 16 | React framework with App Router |
| `react` 19 | UI library |
| `@prisma/client` 7.5 | ORM for database queries |
| `@prisma/adapter-libsql` | Adapter for Turso (LibSQL) |
| `next-auth` 5 beta | Authentication & sessions |
| `bcryptjs` | Password hashing (credentials provider) |
| `@aws-sdk/client-s3` | AWS S3 SDK (Cloudflare R2 compatible) |
| `@dnd-kit` | Drag-drop reordering library |
| `next-themes` | Dark mode theme management |
| `tailwindcss` 4 | Utility-first CSS framework |
| `zod` | Schema validation |

## Common Workflows

### Add a new content type (e.g., video)
1. Add model to `prisma/schema.prisma` with `roomId`, `order`, `userId`
2. Run `npm run db:push`
3. Create `src/app/api/videos/route.ts` (POST/GET)
4. Create `src/app/api/videos/[id]/route.ts` (PATCH/DELETE)
5. Add component in `src/components/` to display it
6. Add to Room page to show it

### Add an API endpoint
1. Create folder `src/app/api/[resource]/`
2. Add `route.ts` with `GET`, `POST`, `PATCH`, `DELETE` handlers
3. All handlers start with `const user = await auth()`
4. Scope queries to `userId`
5. Return JSON responses with status codes

### Modify Prisma schema
1. Edit `prisma/schema.prisma`
2. Run `npm run db:push` (for Turso) or `npx prisma migrate dev` (for local)
3. Commit the changes

### Update UI components
1. Components in `src/components/ui/` are reusable
2. Use Tailwind for styling
3. Import from `@/components/ui/[ComponentName]`
4. Pass props with TypeScript interfaces for type safety

### Deploy to production
Uses Turso for database (serverless SQLite). Set env vars in hosting platform (Vercel, etc.):
- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`
- `AUTH_SECRET`
- `AUTH_URL`
- R2 credentials (if file uploads enabled)

## Important Notes

1. **User Ownership**: Always enforce `userId` in queries — no cross-user data leaks
2. **Cascade Deletes**: When deleting a parent, delete all children in reverse hierarchy order
3. **Drag-Drop**: Uses `order` field (Int) on sortable items; update via `/api/reorder`
4. **File Uploads**: Use `FormData` on client, multipart parser on server; R2 paths are `uploads/images/` or `uploads/files/`
5. **Dark Mode**: Configured via `next-themes`; use `dark:` Tailwind classes
6. **Auth Sessions**: JWT in cookies; check `/login` for unauthenticated users
7. **Service Worker**: Caching strategy is network-first; `public/sw.js` handles offline support
8. **Prisma Generate**: Run automatically on `npm run build`; output is in `src/generated/prisma/`
