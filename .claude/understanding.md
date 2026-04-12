# Holocron — Codebase Understanding

## Project Overview
Military unit management platform for the **9th Assault Corps**. Handles roster, ORBAT, attendance, campaigns, training, qualifications, recruitment, and trooper profiles. Built for Discord OAuth authenticated members.

## Tech Stack
- **Framework**: Next.js 15 (App Router, server components + server actions)
- **ORM**: Drizzle ORM + Neon PostgreSQL (serverless)
- **Auth**: NextAuth v5 with Discord OAuth
- **UI**: shadcn/ui + Tailwind CSS + Radix UI
- **Forms**: react-hook-form + Zod validation
- **Rich text**: TipTap (`src/components/tiptap/editor.tsx`)
- **Package manager**: Bun (`bun run dev`, `bun run db:generate`, etc.)
- **Migrations**: `bun run db:generate` (local), `bun run db:generate:prod` (prod)

## Directory Structure
```
src/
├── app/
│   ├── page.tsx               # Homepage (currently a Google Calendar iframe)
│   ├── layout.tsx             # Root layout (NavBar, ThemeProvider, Toaster)
│   ├── globals.css            # CSS vars (dark green accent9th = hsl(1 49% 40%))
│   ├── _components/           # Shared homepage components (NEW for revamp)
│   ├── admin/                 # Admin pages (layout guards Company+/Admin)
│   │   ├── layout.tsx         # ProtectedRoute guard
│   │   ├── page.tsx           # Admin index (just a placeholder)
│   │   ├── _components/       # Operations CRUD UI
│   │   └── _lib/              # actions.ts, schema.ts, queries.ts, validations.ts
│   ├── api/v1/                # REST API routes (many: trooper, rank, billets, etc.)
│   ├── campaigns/             # Campaign listing + events (client-side fetching)
│   ├── orbat/                 # Org chart (ReactFlow)
│   ├── roster/                # Trooper roster table
│   ├── training/              # Training management
│   ├── qualifications/        # Qualifications browser
│   ├── recruitment/           # Recruitment management
│   └── trooper/[id]/          # Trooper profile (client component, fetch via API)
├── components/
│   ├── nav-bar.tsx            # Top nav (client, uses useController for trooperCtx)
│   ├── nav-main.tsx           # Desktop nav links
│   ├── protected-route.tsx    # Layout-level auth guard (server or client)
│   ├── protected-component.tsx # Inline UI guard (uses useController)
│   ├── tiptap/                # TipTap rich text editor + toolbar
│   └── ui/                    # shadcn/ui components
├── contexts/
│   └── controller.tsx         # Global trooperCtx (id, fullName, rankLevel, departments, billetSlug, billetPermissions, positionPermissions)
├── db/
│   ├── schema.ts              # ALL Drizzle table definitions + Zod schemas
│   ├── index.ts               # DB connection (Neon serverless)
│   └── utils.ts               # DB helpers
├── lib/
│   ├── types.ts               # Shared TS types (RankLevel enum, OperationEntry, EventEntry, etc.)
│   ├── permissions.ts         # checkPermissionsSync(userCtx, allowedPermissions[])
│   ├── utils.ts               # cn(), formatDate(), getFullTrooperName()
│   └── unstable_cache.ts      # Wraps next/cache unstable_cache in React cache for dedup
├── services/                  # "use server" data functions (all DB access goes here)
│   ├── troopers.ts            # getTroopers, createTrooper, updateTrooper, deleteTrooper, getTrooperRank
│   ├── campaigns.ts           # getCampaigns, createCampaignEvent, updateCampaignEvent, deleteCampaignEvent
│   ├── billets.ts             # getBillets, getBilletInformation, createBilletAssignment, getTrooperBilletSlug
│   ├── permissions.ts         # getBilletHierarchyChain, getPositionHierarchyChain
│   ├── attendances.ts         # createAttendance, updateOperation, etc.
│   ├── qualifications.ts      # getQualifications, etc.
│   ├── ranks.ts               # getRanks, getRank
│   ├── departments.ts         # getDepartments, etc.
│   ├── operations.ts          # getOperations, etc.
│   ├── trainings.ts           # getTrainings, etc.
│   └── users.ts               # getUser, etc.
└── types/
    └── index.ts               # dict type alias etc.
```

## Database Schema Summary
All in `src/db/schema.ts`. Key tables:
- `troopers` — core trooper record (id, status, rank, numbers 1000-9999, name, recruitmentDate, attendances)
- `ranks` — rank definitions (grade, name, abbreviation, rankLevel enum: Enlisted/JNCO/SNCO/Company/Command)
- `qualifications` — qual definitions (name, abbreviation, category enum)
- `trooper_qualifications` — join table
- `trainings` — training sessions (trainerId, traineeIds[], qualificationId, trainingDate)
- `attendances` — operation records (zeusId, coZeusIds[], eventDate, eventType, eventNotes)
- `trooper_attendances` — join table (attendance <-> trooper)
- `unit_elements` — org chart nodes (name, icon, parentId, priority)
- `billets` — roles within unit elements (role, slug, unitElementId, superiorBilletId, priority)
- `billet_assignments` — trooper <-> billet (unique on both billetId and trooperId)
- `departments` — staff departments (name, icon, parentId, departmentScopes[])
- `department_positions` — roles within departments (role, slug, departmentId, superiorPositionId)
- `department_assignments` — trooper <-> department position
- `campaigns` — campaign definitions (name, description, startDate, endDate, isActive)
- `campaign_events` — events within campaigns (campaignId, name, eventDate, eventTime, eventType, zeusId, bannerImage)
- `invites` — invite codes for trooper account linking
- `users` — Discord accounts linked to troopers (name = discord username, trooperId)

### Enums
- `status`: Active | Inactive | Discharged
- `rankLevel`: Enlisted | JNCO | SNCO | Company | Command
- `scopes`: Admin | Recruitment | Training | Attendance | Roster | Qualifications | Mod | Zeus
- `eventTypes`: Main | Skirmish | Fun | Raid | Joint
- `qualificationCategory`: Standard | Medical | Advanced | Aviation | Detachments | Leadership

## Auth & Permissions Model
- **NextAuth** (Discord OAuth) — session established via `/api/auth`
- **trooperCtx** (stored in cookie, hydrated in `ControllerContext`) contains:
  - `id`, `fullName`, `rankLevel`, `departments[]`, `billetSlug`, `positionSlugs[]`
  - `billetPermissions[]` — full hierarchy chain of billet slugs (includes all subordinates)
  - `positionPermissions[]` — full hierarchy chains for all positions
- **`checkPermissionsSync(trooperCtx, allowedPermissions[])`** — checks rank level, department scopes, billet slug hierarchy, or position slug hierarchy (OR logic)
- **`<ProtectedRoute>`** — layout wrapper (server/client) that redirects if no auth
- **`<ProtectedComponent>`** — inline UI guard that hides children if not authorized
- Common permission strings: `"Admin"`, `"Mod"`, `RankLevel.Company`, `RankLevel.Command`, billet slug strings (e.g., `"cinder-1:lead"`)

## Key Conventions & Patterns

### Services ("use server")
- All DB access in `src/services/` files marked `"use server"`
- Return data directly or `{ success: true }` / `{ error: "message" }` objects
- Use `revalidateTag("tag-name")` after mutations
- Use `unstable_cache(fn, keyParts, options)` for read caching (wraps Next.js cache in React.cache)

### API Routes
- All in `src/app/api/v1/[name]/route.ts`
- Export `GET`, `POST`, `PUT`, `DELETE` functions
- Use `NextRequest` + `NextResponse.json()`
- Client-side pages (especially trooper profile) fetch from these API routes

### Pages & Components
- Server components by default; add `"use client"` only when needed
- Client-side data fetching via `useEffect` + `fetch("/api/v1/...")` (see `profile.tsx`, `campaigns/page.tsx`)
- Forms use react-hook-form + `zodResolver` + Zod schemas
- Dialogs for create/edit flows using shadcn/ui Dialog
- Toast notifications via `sonner` (`toast.success()`, `toast.error()`)

### Styling
- Dark mode supported via ThemeProvider
- Custom CSS vars: `--accent-9th: 1 49% 40%` (dark red-ish, used as unit accent color) → `accent9th` Tailwind class
- `border-accent9th` used on nav header
- `bg-background`, `text-foreground`, `text-muted-foreground` for theme-aware colors
- shadcn Card, Badge, Button, Dialog, Sheet, DropdownMenu, Separator used throughout

### TipTap Editor
- Located at `src/components/tiptap/editor.tsx`
- Props: `value`, `onChange`, `editable`, `className`
- Uses StarterKit, Highlight, TextStyleKit, TextAlign, Typography, Placeholder
- Renders `EditorToolbar` when editable
- Import: `import TiptapEditor from "@/components/tiptap/editor"`

## BattleMetrics Server IDs
- Server 1: `37059022`
- Server 2: `37147687`
- Public API: `GET https://api.battlemetrics.com/servers/{id}`

## Nav Items (current)
ORBAT | Roster | Campaigns | Recruitment | Training (Training scope or Company+) | Admin (Company+ or Admin scope)

## DB Commands
```bash
bun run db:generate    # generate local migration
bun run db:push        # push to local DB
bun run db:migrate     # apply local migrations
bun run db:generate:prod / db:push:prod / db:migrate:prod
```
