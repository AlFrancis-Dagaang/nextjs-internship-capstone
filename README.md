# genzpace — Next.js Internship Capstone Project

> A 12-week full-stack development internship capstone: building **genzpace**, a modern Kanban-style project management tool with Next.js 16, React 19, and TypeScript.

[![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![pnpm](https://img.shields.io/badge/pnpm-10.10.0-yellow?logo=pnpm)](https://pnpm.io/)

## Repository Structure

```
genzpace/
├── project/              # Main Next.js application
│   ├── app/               # Next.js 16 App Router
│   ├── components/        # React components
│   ├── lib/                # Server Actions, services, db, validation
│   ├── hooks/               # Custom React hooks
│   ├── stores/              # State management (Zustand)
│   ├── types/               # TypeScript definitions
│   ├── test/                 # Unit + integration tests
│   ├── e2e/                  # Playwright end-to-end tests
│   └── README.md             # Project-level documentation
├── docs/                   # Program documentation
│   ├── CODE_REVIEW_GUIDE.md
│   ├── DEVELOPMENT_SETUP.md
│   └── TIMELINE_MILESTONES.md
└── tasks/                  # Task breakdown and planning
    ├── INDIVIDUAL_DEVELOPMENT_APPROACH.md
    └── tasks-capstone-project-management-tool.md
```

## Project Overview

**genzpace** is a Kanban-style project management tool (similar to Trello/Asana) built solo as an internship capstone project. This is an individual fork — no team coordination in the tooling sense, just one intern's end-to-end build and personal backlog tracking.

### Key Features

- **Authentication** — Google OAuth + email/password via Clerk, with route protection and a self-healing user-sync fallback for webhook lag
- **Projects & Kanban boards** — create projects, manage lists and tasks with drag-and-drop (dnd-kit)
- **Team collaboration** — multi-assignee tasks, team creation/attachment, and role-based access (owner / admin / editor / contributor / viewer)
- **Real-time updates** — live board, notification, and role-change sync across sessions via Pusher
- **Comments & activity feed** — per-task comments and an auditable activity log
- **Notifications** — in-app notifications with per-type user preferences
- **Calendar view** — personal and project-linked events
- **Analytics dashboard** — project progress, team activity, and completion stats with drill-downs (Recharts)
- **Due-date reminders** — scheduled via a Vercel Cron job
- **Theme support** — light/dark mode via a custom design system

### Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 16.1.6 (App Router with Turbopack) |
| **Runtime** | React 19 |
| **Language** | TypeScript 5.9 (strict mode) |
| **Styling** | Tailwind CSS 4.3.3 (CSS-first, `@theme`) + Shadcn/UI |
| **Database** | PostgreSQL (Neon) + Drizzle ORM |
| **Auth** | Clerk |
| **Real-time** | Pusher |
| **State** | Zustand |
| **Validation** | Zod |
| **Testing** | Jest, React Testing Library, Playwright |
| **Linting/Formatting** | Biome |
| **Deployment** | Vercel |

## Quick Start

### Prerequisites

- **Node.js** 22.19.0 (pinned via `.nvmrc` / `engines`)
- **pnpm** 10.10.0+ (`npm install -g pnpm`)
- **Git** for version control
- A [Neon](https://neon.tech) PostgreSQL database, a [Clerk](https://clerk.com) app, and a [Pusher](https://pusher.com) app
- **VS Code** (recommended)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR-USERNAME/genzpace.git
   cd genzpace
   ```

2. **Navigate to the project directory**
   ```bash
   cd project
   ```

3. **Install dependencies**
   ```bash
   pnpm install
   ```

4. **Set environment variables**

   Create `project/.env.local` with your Clerk, Neon, Pusher, and cron-secret values (see [project/README.md](project/README.md) for the full list).

5. **Run database migrations**
   ```bash
   pnpm drizzle-kit generate
   pnpm drizzle-kit migrate
   ```

6. **Start the development server**
   ```bash
   pnpm dev
   ```

7. **Open in browser**
   - Visit [http://localhost:3000](http://localhost:3000)

### Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run Biome lint
pnpm test         # Run Jest unit + integration tests
pnpm test:e2e     # Run Playwright end-to-end tests
```

## Documentation

| Document | Description |
|----------|-------------|
| [Project README](project/README.md) | Main application documentation — setup, architecture, and Vercel deployment |
| [Development Setup](docs/DEVELOPMENT_SETUP.md) | Setup guide and git workflow |
| [Timeline & Milestones](docs/TIMELINE_MILESTONES.md) | 12-week project timeline |
| [Code Review Guide](docs/CODE_REVIEW_GUIDE.md) | Code review standards |
| [Tasks Breakdown](tasks/tasks-capstone-project-management-tool.md) | Detailed task list |
| [Individual Dev Approach](tasks/INDIVIDUAL_DEVELOPMENT_APPROACH.md) | Fork strategy, git workflow, deployment |

## 12-Week Program Structure

### Phase 1: Foundation (Weeks 1-3)
- Project setup and Next.js fundamentals
- Environment configuration
- Git workflow and best practices

### Phase 2: Implementation (Weeks 4-8)
- Authentication with Clerk
- Database design and implementation (PostgreSQL + Drizzle)
- Core CRUD operations for projects, lists, and tasks
- Kanban board with drag-and-drop
- State management with Zustand
- Multi-assignee tasks, teams, real-time sync, notifications, calendar, and analytics

### Phase 3: Production (Weeks 9-12)
- Comprehensive testing (unit, integration, E2E)
- Performance optimization
- Production deployment
- Documentation and showcase

## Learning Objectives

By completing this capstone, interns will demonstrate:

- Full-stack Next.js 16 development with App Router
- Server Components and Server Actions
- TypeScript for type-safe development
- PostgreSQL database design with Drizzle ORM
- Authentication and authorization with Clerk
- Client-side state management with Zustand
- Real-time features with Pusher
- Testing strategies (unit, integration, E2E)
- Git workflow and collaboration
- Production deployment to Vercel (manual deploy by default; GitHub Actions workflow included but disabled — see [project/README.md](project/README.md#deployment))

## Current Status

Phases 1 through 7 are fully complete. Phase 8 (Deployment) is in progress:

- **Foundation, auth, and database**: complete
- **Core CRUD, Kanban board, drag-and-drop**: complete
- **Teams, roles, real-time sync, notifications, calendar, analytics**: complete
- **Testing (unit, integration, E2E)**: complete
- **Deployment**: live at `genzpace.vercel.app`; production database migration and monitoring setup still in progress

## Development Approach

### Individual Development
Each intern builds their own complete version by:
1. **Forking** this repository
2. **Working independently** through all phases
3. **Building** the entire stack from start to finish
4. **Owning** their complete portfolio project

### Collaborative Learning
Despite individual development, interns collaborate through:
- Daily standups sharing progress and blockers
- Code review sessions for learning
- Technical discussions on implementation approaches
- Knowledge sharing and problem-solving

## Contributing

This is an internship learning project. Each intern maintains their own fork and develops independently.

## License

This project is for educational purposes as part of the internship program.

## Support & Resources

- **Project Documentation**: See [docs/](docs/) folder
- **Task Breakdown**: See [tasks/](tasks/) folder
- **Next.js Docs**: https://nextjs.org/docs
- **React Docs**: https://react.dev
- **TypeScript Docs**: https://www.typescriptlang.org/docs

---

**Built as part of the Stratpoint Engineering Internship Program**