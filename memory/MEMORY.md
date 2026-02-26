# Holocron Project Memory

## Project Overview
- **Next.js 15** app router, **React 19**, **TypeScript**
- **Tailwind CSS v3** with Radix UI components
- **NextAuth.js** with Discord OAuth
- **Drizzle ORM** + Neon serverless PostgreSQL
- Star Wars military sim unit management platform (9th Assault Corps)

## Key Architecture
- `src/app/` — App Router pages
- `src/components/` — Reusable UI components (Radix UI based)
- `src/contexts/controller.tsx` — `useController()` provides `trooperCtx` (user's trooper info)
- `src/lib/permissions.ts` — `checkPermissionsSync(trooperCtx, permissions[])` for permission checks
- `src/lib/types.ts` — `RankLevel` enum (JNCO, SNCO, Company, Command)

## Navigation
- `src/components/nav-bar.tsx` — Fixed header with mobile hamburger menu (Sheet from left)
  - Desktop: shows `NavMain` (NavigationMenu links)
  - Mobile: hamburger button → Sheet slide-in with nav links
  - `navItems` array defined in nav-bar.tsx, shared between desktop and mobile
- `src/components/nav-main.tsx` — Desktop NavigationMenu (hidden on mobile via `hidden md:flex` in navbar)

## Mobile Improvements Made (2026-02)
All major pages fixed for mobile:
- **NavBar**: Added hamburger Sheet menu, smaller title on mobile, hidden "Hi {name}" on xs
- **Recruitment**: Fixed `grid-cols-1 md:grid-cols-2`, combobox buttons `w-full`
- **ORBAT**: Fixed tab width to `w-full md:w-3/4`
- **Profile**: `px-4 md:px-8`, `min-h-screen`, smaller stats text on mobile
- **Qualifications**: `grid-cols-2 sm:grid-cols-3 md:grid-cols-4`
- **All container pages**: `p-4 md:p-6` or `p-4 md:p-8` instead of fixed `p-6`/`p-8`
- **Campaigns/Events**: `flex-wrap` on header, responsive headings `text-2xl md:text-3xl`
- **Training detail/qual detail**: responsive header layout with `flex-col sm:flex-row`

## Key Patterns
- Permission check: `checkPermissionsSync(trooperCtx, ['Admin', RankLevel.Command, ...])`
- Protected UI: `<ProtectedComponent allowedPermissions={[...]}>`
- Protected nav item: `<ProtectedNavItem href="/..." allowedPermissions={[...]}>`
- Mobile detection: `useIsMobile()` hook (768px breakpoint)
- Tailwind mobile-first: sm=640px, md=768px, lg=1024px

## Roster Table
- `src/app/roster/table.tsx` — DateRangePicker with `w-full sm:w-56 md:w-60`
- Table has `overflow-auto` wrapper for horizontal scroll on mobile

## Auth
- `getServerSession()` for server-side session
- `useSession()` for client-side session
