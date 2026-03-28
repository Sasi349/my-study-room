# My Study Room

A full-stack learning management PWA for organizing study materials, tracking streaks, and monitoring syllabus progress.

---

## Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | **Next.js** | 16.1.7 | Full-stack React framework (App Router) |
| Runtime | **React** | 19.2.3 | UI component library |
| Language | **TypeScript** | 5.x | Type-safe JavaScript |
| Styling | **Tailwind CSS** | 4.x | Utility-first CSS framework |
| Database | **Turso (LibSQL)** | — | Edge-distributed SQLite database |
| ORM | **Prisma** | 7.5.0 | Type-safe database client & migrations |
| Auth | **NextAuth v5** | 5.0.0-beta.30 | Credentials & passcode authentication |
| Storage | **Cloudflare R2** | — | S3-compatible object storage for files |
| Icons | **Lucide React** | 0.577.0 | Icon library |
| Drag & Drop | **dnd-kit** | 6.3.1 | Drag-and-drop reordering |
| Fonts | **Geist + Noto Tamil** | — | Typography with Tamil language support |
| Password | **bcryptjs** | 3.0.3 | Password hashing (12 rounds) |

---

## Features

### Study Organization
Hierarchical content structure: **Categories > Subjects > Rooms > Notes / Links / Files / Images**. All levels support drag-and-drop reordering.

### Streak Tracking
Daily habit tracker with a 7-day week grid, consecutive streak counting, and week navigation. Displayed on the home page.

### Syllabus Tracker
Create syllabi (e.g., "FullStack Development") broken into topics and items. Supports **multi-user progress tracking** — multiple people can share the same login and track individual progress via named member profiles.

### PWA
Installable on mobile and desktop. Service worker with network-first strategy and offline fallback.

---

## Application Architecture

### Page Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | Redirect | Redirects to `/categories` |
| `/login` | Login | Passcode (4-digit PIN) or credentials login |
| `/categories` | Home | Category list, streak tracker, bottom nav |
| `/categories/[id]` | Subjects | Subject list within a category |
| `/categories/[id]/[id]` | Rooms | Room list within a subject |
| `/categories/[id]/[id]/[id]` | Room Content | Notes, links, files, images |
| `/tracker` | Tracker Home | Syllabus list with progress, bottom nav |
| `/tracker/[id]` | Syllabus Detail | Topics, items, member progress tracking |

### Data Flow

```
Browser (React)  -->  Next.js API Routes  -->  Prisma ORM  -->  Turso DB
File Upload      -->  Next.js API         -->  AWS S3 SDK  -->  Cloudflare R2
```

---

## Database — Turso (LibSQL)

### What is Turso?
A cloud-hosted, edge-distributed SQLite database. Uses LibSQL (an open-source fork of SQLite). Data is stored in **AWS AP-South-1 (Mumbai)**.

### Connection
- **Provider:** LibSQL via `@prisma/adapter-libsql`
- **Config:** `prisma.config.ts` + `src/lib/prisma.ts`
- **Schema:** `prisma/schema.prisma`

### Schema Overview

**Study Organization:**
```
User --> Category --> Subject --> Room --> Note / Link / File
```

**Tracker:**
```
User --> Syllabus --> TrackerTopic  --> TrackerItem
                 --> TrackerMember --> TrackerProgress <--> TrackerItem
```

**Streaks:**
```
User --> Streak --> StreakLog (unique per date)
```

### All Models

| Model | Key Fields | Relations |
|-------|-----------|-----------|
| User | username, password, passcode, name, streakLabel | categories, streaks, syllabi |
| Category | name, icon, order, userId | subjects |
| Subject | name, order, categoryId | rooms |
| Room | name, order, subjectId | notes, links, files |
| Note | title, content, order, roomId | — |
| Link | title, url, order, roomId | — |
| File | name, path, size, mimeType, type, order, roomId | — |
| Streak | name, order, userId | logs |
| StreakLog | date, streakId (unique pair) | — |
| Syllabus | name, order, userId | members, topics |
| TrackerMember | name, syllabusId | progress |
| TrackerTopic | name, order, syllabusId | items |
| TrackerItem | name, order, topicId | progress |
| TrackerProgress | memberId, itemId (unique pair) | — |

### Prisma Commands

```bash
npx prisma generate                    # Regenerate client after schema changes
npx prisma migrate dev --name <name>   # Create & apply migration locally
npx prisma migrate deploy              # Apply pending migrations to production
npx prisma studio                      # Open visual database browser
```

### How to Check Database Usage

**Dashboard:** Go to [turso.tech/app](https://turso.tech/app) -> Select **my-study-room** -> View **Rows Read**, **Rows Written**, **Storage Used**.

**CLI:**
```bash
turso db show my-study-room       # Database info & size
turso db inspect my-study-room    # Detailed usage stats
turso plan show                   # Current plan & billing
```

**Free Tier Limits:**

| Metric | Limit |
|--------|-------|
| Storage | 9 GB |
| Rows Read / month | 1 Billion |
| Rows Written / month | 25 Million |
| Databases | 500 |

---

## File Storage — Cloudflare R2

### What is R2?
Cloudflare's S3-compatible object storage with **zero egress fees**. Files are stored and served via a public URL.

### Configuration
- **SDK:** `@aws-sdk/client-s3` (S3-compatible)
- **File Structure:** `uploads/images/*` and `uploads/files/*`
- **Naming:** `{timestamp}-{sanitized-filename}`
- **Access:** Public URL via `R2_PUBLIC_URL`
- **Config File:** `src/lib/r2.ts`

### How to Check Storage Usage

**Dashboard:** Go to [dash.cloudflare.com](https://dash.cloudflare.com) -> **R2 Object Storage** -> Click your bucket -> View **Objects count**, **Storage used**, **Requests**.

**CLI (Wrangler):**
```bash
npx wrangler r2 object list <bucket-name>
```

**Free Tier Limits:**

| Metric | Limit / month |
|--------|--------------|
| Storage | 10 GB |
| Class A Operations (write) | 1 Million |
| Class B Operations (read) | 10 Million |
| Egress (data transfer) | **Unlimited (free)** |

---

## Authentication — NextAuth v5

### Auth Flow
```
Login Page --> Passcode / Credentials --> Prisma User Lookup --> bcrypt Verify --> JWT Token
```

### Details

| Feature | Details |
|---------|---------|
| Session Strategy | JWT (stateless, no database sessions) |
| Providers | Credentials (username + password) & Passcode (4-digit PIN) |
| Password Hashing | bcryptjs with 12 rounds |
| Route Protection | Middleware checks `authjs.session-token` cookie |
| Config File | `src/lib/auth.ts` |
| Cost | **Free** — runs entirely within the app, no external service |

---

## PWA Configuration

| Property | Value |
|----------|-------|
| App Name | My Study Room |
| Display Mode | Standalone |
| Start URL | `/categories` |
| Theme Color | `#2563eb` (Blue) |
| Cache Strategy | Network-first, offline fallback to `/login` |
| Cache Name | `learning-rooms-v1` |
| Icons | 192x192 & 512x512 PNG (+ maskable) |
| Manifest | `public/manifest.json` |
| Service Worker | `public/sw.js` |

---

## Environment Variables

| Variable | Service | Description |
|----------|---------|-------------|
| `TURSO_DATABASE_URL` | Database | Turso LibSQL connection URL |
| `TURSO_AUTH_TOKEN` | Database | Turso authentication token |
| `AUTH_SECRET` | Auth | NextAuth encryption secret for JWT signing |
| `AUTH_URL` | Auth | Application base URL |
| `R2_ENDPOINT` | Storage | Cloudflare R2 S3-compatible endpoint |
| `R2_ACCESS_KEY_ID` | Storage | R2 access key ID |
| `R2_SECRET_ACCESS_KEY` | Storage | R2 secret access key |
| `R2_BUCKET_NAME` | Storage | R2 bucket name |
| `R2_PUBLIC_URL` | Storage | Public URL for accessing stored files |

---

## Usage & Billing Summary

| Service | Dashboard | Free Tier | Likely Usage |
|---------|-----------|-----------|-------------|
| **Turso** | [turso.tech/app](https://turso.tech/app) | 9GB storage, 1B reads/mo | Very low — text data is tiny |
| **Cloudflare R2** | [dash.cloudflare.com](https://dash.cloudflare.com) -> R2 | 10GB storage, free egress | Low-Medium — depends on file uploads |
| **Vercel** | [vercel.com/dashboard](https://vercel.com/dashboard) | 100GB bandwidth/mo, 100K invocations/day | Low |
| **NextAuth** | N/A (self-hosted) | Free | Free |

**Estimated monthly cost: $0** — All services are within free tier limits for a personal study app with a few users. Monitor R2 storage if uploading many large files.

---

## API Endpoints

### Study Organization
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | List all categories |
| POST | `/api/categories` | Create category |
| PUT | `/api/categories/[id]` | Update category |
| DELETE | `/api/categories/[id]` | Delete category (cascades) |
| GET | `/api/subjects?categoryId=` | List subjects |
| POST | `/api/subjects` | Create subject |
| GET | `/api/rooms?subjectId=` | List rooms |
| POST | `/api/rooms` | Create room |
| POST | `/api/notes` | Create note |
| POST | `/api/links` | Create link |
| POST | `/api/files` | Upload file (multipart) |
| PATCH | `/api/reorder` | Reorder any model |

### Streak Tracking
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/streaks` | List all streaks with logs |
| POST | `/api/streaks` | Create streak |
| PUT | `/api/streaks/[id]` | Rename streak |
| DELETE | `/api/streaks/[id]` | Delete streak |
| PATCH | `/api/streaks/[id]` | Toggle day check-in |

### Syllabus Tracker
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tracker` | List all syllabi |
| POST | `/api/tracker` | Create syllabus |
| GET | `/api/tracker/[id]` | Full syllabus detail |
| PUT | `/api/tracker/[id]` | Rename syllabus |
| DELETE | `/api/tracker/[id]` | Delete syllabus |
| POST | `/api/tracker/[id]/topics` | Add topic |
| POST | `/api/tracker/[id]/members` | Add member |
| POST | `/api/tracker/topics/[id]/items` | Add item to topic |
| PUT | `/api/tracker/topics/[id]` | Rename topic |
| DELETE | `/api/tracker/topics/[id]` | Delete topic |
| PUT | `/api/tracker/items/[id]` | Rename item |
| DELETE | `/api/tracker/items/[id]` | Delete item |
| PUT | `/api/tracker/members/[id]` | Rename member |
| DELETE | `/api/tracker/members/[id]` | Remove member |
| PATCH | `/api/tracker/progress` | Toggle item completion |

### User & Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user` | Get current user profile |
| PUT | `/api/user` | Update username/password |
| PATCH | `/api/user` | Update preferences |
| POST | `/api/auth/[...nextauth]` | NextAuth sign-in/sign-out |

---

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env   # Then fill in your values

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Build for Production

```bash
npm run build
npm start
```
