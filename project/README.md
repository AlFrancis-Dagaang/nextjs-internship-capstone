# genzpace

A Kanban-style project management tool (Trello/Asana-like), built as a solo 12-week internship capstone project.

**Live**: [genzpace.vercel.app](https://genzpace.vercel.app)

## Features

- **Projects & Boards** — create projects with drag-and-drop Kanban boards (lists + tasks)
- **Multi-assignee tasks** — assign multiple people to a task, with quick-assign and full checkbox-modal flows
- **Team management** — create teams, attach them to projects, with role resolution merging direct and team-derived membership
- **Role-based access** — owner / admin / editor / contributor / viewer roles at both the project and team-attachment level
- **Real-time collaboration** — live board updates, notifications, and member/role changes via Pusher, synced across open sessions
- **Comments & activity feed** — per-task comments and an auditable activity log
- **Notifications** — in-app notifications with per-type user preferences (opt-out by default)
- **Calendar view** — personal and project-linked events, correctly grouped by local date
- **Analytics dashboard** — project progress, team activity, completion stats, and per-member breakdowns (Recharts), with drill-down panels
- **Due-date reminders** — scheduled via a Vercel Cron job
- **Auth** — Google OAuth and email/password via Clerk, with self-healing user sync

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16.1.6 (App Router, Turbopack) |
| Runtime | React 19 |
| Language | TypeScript 5.9 (strict mode) |
| Styling | Tailwind CSS 4.3.3 (CSS-first, `@theme`) |
| UI Kit | Shadcn/UI |
| Icons | Lucide React |
| Charts | Recharts |
| State | Zustand |
| Drag & drop | @dnd-kit/core, @dnd-kit/sortable |
| Validation | Zod |
| Auth | Clerk |
| Real-time | Pusher |
| Database | PostgreSQL (Neon) + Drizzle ORM |
| Testing | Jest, React Testing Library, Playwright |
| Linting/Formatting | Biome |
| Deployment | Vercel |
| Package manager | pnpm |

## Getting Started

### Prerequisites

- Node **22.19.0** (pinned via `.nvmrc` / `engines`)
- pnpm **10.10.0**
- A [Neon](https://neon.tech) PostgreSQL database
- A [Clerk](https://clerk.com) application (for auth)
- A [Pusher](https://pusher.com) app (for real-time features)

### Installation

```bash
git clone <repo-url>
cd genzpace
pnpm install
```

### Environment variables

Create a `.env.local` file with:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=
NEXT_PUBLIC_CLERK_SIGN_UP_URL=
CLERK_WEBHOOK_SECRET=

DATABASE_URL=

PUSHER_APP_ID=
PUSHER_SECRET=
NEXT_PUBLIC_PUSHER_KEY=
NEXT_PUBLIC_PUSHER_CLUSTER=

CRON_SECRET=
```

### Database setup

```bash
pnpm drizzle-kit generate   # generate migrations from lib/db/schema.ts
pnpm drizzle-kit migrate    # apply migrations
```

### Run locally

```bash
pnpm dev
```

The app will be available at `http://localhost:3000`.

## Testing

```bash
pnpm test          # unit + integration tests (Jest + React Testing Library)
pnpm test:e2e      # end-to-end tests (Playwright)
pnpm test:e2e:ui   # Playwright UI mode
pnpm lint          # Biome lint
```

Unit/integration tests live under `test/{components,modals,utils,integration}/`, mirroring the `components/`/`app/` structure. E2E specs live under `e2e/`, including one full critical-journey test (sign-in → create project → create task → drag-and-drop → sign-out) plus per-route coverage.

## Project Structure

```
app/
├── (auth)/              # Clerk sign-in / sign-up
├── (dashboard)/         # authenticated app shell (layout, resource-based auth check)
├── projects/[id]/       # project pages, incl. per-project team view
components/
├── <domain>/            # domain folders (projects, tasks, dashboard, ...), with modals/ nested inside
lib/
├── actions/             # Server Actions (controller layer)
├── services/            # shared business logic (auth, ownership, assignee, team, notifications, activity)
├── db/
│   ├── schema.ts        # Drizzle schema
│   ├── client.ts        # Neon/Drizzle client
│   └── queries/         # per-domain query modules
├── realtime/            # Pusher client/server helpers
├── validations.ts       # Zod schemas (client + server validation)
test/                    # unit + integration tests
e2e/                     # Playwright end-to-end tests
```

## Architecture Notes

- **Server Components by default**; Client Components only where interactivity is needed.
- **Server Actions** are preferred over API routes for mutations, and follow a controller pattern (parse → service → query → typed `ActionResult<T>`).
- **Authorization** is resource-based and re-derived server-side on every action from Clerk's session — never trusted from client input.
- **Optimistic UI**: mutations apply to client state immediately and revert on failure.
- **Real-time sync** via Pusher, with per-project and per-user channels; the originating client's own broadcasts are skipped via an `originClientId` echo guard.
- **Multi-assignee model**: a `task_assignees` join table, not a single `assigneeId` column.
- Full architectural decision history is tracked in the project's internal `project-context.md`.

## Deployment

Deployed on Vercel (`genzpace.vercel.app`), deployed manually via `vercel --prod`. GitHub Actions deploy automation exists in `.github/workflows/deploy.yml` but is disabled by default — pull requests are used for previews instead.

## Git Workflow

- One branch per issue: `feature/<desc>`, `fix/<desc>`, `docs/<desc>`
- Commits follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`)
- Merges via **GitHub PR + Squash and merge** (not local `git merge`)

## License

This project was built as an individual internship capstone. License terms TBD.