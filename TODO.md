# Holocron — Feature Roadmap

## Branch Strategy

All feature branches stem from `feature/TODO_kickstarter`.
Each branch includes its own schema migrations.
Merge order matters where noted (see dependencies).

```
main
└── feature/TODO_kickstarter       ← base planning branch
    ├── feature/homepage-revamp    ← Task 1 (independent)
    ├── feature/billet-pages       ← Task 3 (independent, higher priority than admin)
    ├── feature/google-calendar    ← Task 2 (independent)
    ├── feature/admin-controls     ← Task 4 (merge billet-pages first — manages billet page content)
    ├── feature/medals             ← Task 5 (independent)
    └── feature/wiki               ← Task 6 (independent)
```

---

## Implementation Order

| Priority | Task | Branch | Depends On |
|----------|------|---------|------------|
| 1 | Homepage Revamp | `feature/homepage-revamp` | — |
| 2 | Billet Info Pages | `feature/billet-pages` | — |
| 3 | Google Calendar | `feature/google-calendar` | — |
| 4 | Admin Controls | `feature/admin-controls` | merge `feature/billet-pages` first |
| 5 | Medals/Commendations | `feature/medals` | — |
| 6 | Wiki Pages | `feature/wiki` | — |

> **Note:** Billet pages are prioritized above admin controls because squad leaders need to be able to maintain their pages before an admin UI is needed to manage the billet structure itself.

---

## Task 1 — Homepage Revamp
**Branch:** `feature/homepage-revamp`
**Stems from:** `feature/TODO_kickstarter`

### Motivation
Replace the basic Google Calendar iframe with a rich, tactical dashboard. The page should serve as a unit command center.

### Design
- **Hero banner**: Unit logo/crest + "9th Assault Corps" title with dark background
- **Stats row** (4 cards): Active Members, Missions Completed, Success Rate, Next Event countdown
- **Main content** (two-column 70/30):
  - Left: Upcoming Events (from `campaign_events`), News & Announcements
  - Right: Server Status (BattleMetrics), Current Campaigns, Quick Links
- **"Who We Are"** button linking to `/unit` page

### New DB Table
```sql
announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  category ENUM('News', 'Announcement') NOT NULL DEFAULT 'Announcement',
  isImportant BOOLEAN DEFAULT false,
  authorId UUID REFERENCES troopers(id),
  createdAt TIMESTAMP DEFAULT now(),
  updatedAt TIMESTAMP DEFAULT now()
)
```

### BattleMetrics Integration
- New API route: `GET /api/v1/server-status`
- Polls BattleMetrics public API: `https://api.battlemetrics.com/servers/{id}`
- Server IDs: `37059022`, `37147687` (stored in `BATTLEMETRICS_SERVER_IDS` env var)
- Response: name, status (online/offline), playerCount, maxPlayers, currentMap

### Files to Create/Modify
- `src/app/page.tsx` — Full homepage rewrite (server component)
- `src/app/_components/hero-banner.tsx`
- `src/app/_components/stats-row.tsx`
- `src/app/_components/upcoming-events.tsx`
- `src/app/_components/server-status.tsx`
- `src/app/_components/current-campaigns.tsx`
- `src/app/_components/announcements-feed.tsx`
- `src/app/_components/quick-links.tsx`
- `src/app/api/v1/server-status/route.ts` — BattleMetrics proxy
- `src/app/api/v1/announcements/route.ts` — CRUD
- `src/app/unit/page.tsx` — "Who We Are" page (unit elements + billets grid)
- `src/db/schema.ts` — Add `announcements` table + `announcementCategory` enum
- `src/services/announcements.ts` — Announcement service

### Environment Variables
```bash
BATTLEMETRICS_SERVER_IDS=37059022,37147687
```

---

## Task 3 — Billet / Element Information Pages *(Priority 2)*
**Branch:** `feature/billet-pages`
**Stems from:** `feature/TODO_kickstarter`

### Motivation
Give squad leaders the ability to maintain their own billet/element pages with editable content, visible to all troopers.

### Design
- Route: `/billets/[slug]` (e.g., `/billets/cinder-1`)
- Displays: billet name, assigned trooper, parent element, rich text content
- Edit button visible to: the trooper holding the billet (via `billetSlug` in session), their superiors in the hierarchy, and Admin scope holders
- Rich text editor: TipTap (already installed at `src/components/tiptap/editor.tsx`)

### New DB Table
```sql
billet_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  billetId UUID UNIQUE NOT NULL REFERENCES billets(id) ON DELETE CASCADE,
  content TEXT,  -- TipTap HTML
  lastEditedBy UUID REFERENCES troopers(id),
  updatedAt TIMESTAMP DEFAULT now()
)
```

### Files to Create/Modify
- `src/app/billets/[slug]/page.tsx` — Dynamic billet page (server component shell)
- `src/app/billets/[slug]/_components/BilletPageContent.tsx` — Read-only rendered content
- `src/app/billets/[slug]/_components/BilletPageEditor.tsx` — TipTap editor (client)
- `src/app/billets/[slug]/_lib/actions.ts` — `savePageContent` server action
- `src/services/billet-pages.ts` — `getBilletPage`, `upsertBilletPage`
- `src/db/schema.ts` — Add `billetPages` table

---

## Task 2 — Native Event Scheduling + Google Calendar
**Branch:** `feature/google-calendar`
**Stems from:** `feature/TODO_kickstarter`

### Motivation
Scheduling forms that create campaign events and push them to the unit's Google Calendar.

### Google Calendar Setup Required (before implementation)
1. Create Google Cloud project, enable Calendar API
2. Create Service Account, download credentials JSON
3. Share existing Google Calendar with service account email
4. Store: `GOOGLE_SERVICE_ACCOUNT_KEY` (JSON string), `GOOGLE_CALENDAR_ID`

### Schema Change
```sql
-- Add column to campaign_events:
googleCalendarEventId TEXT
```

### Files to Create/Modify
- `src/services/google-calendar.ts` — `createEvent()`, `updateEvent()`, `deleteEvent()` wrappers
- `src/app/campaigns/_lib/actions.ts` — Extend create/update/delete to call GCal
- `src/db/schema.ts` — Add `googleCalendarEventId` to `campaignEvents`

### Environment Variables
```bash
GOOGLE_SERVICE_ACCOUNT_KEY='{...json...}'
GOOGLE_CALENDAR_ID=your_calendar_id@group.calendar.google.com
```

### Install
```bash
bun add googleapis
```

---

## Task 4 — Admin Controls *(depends on billet-pages being merged)*
**Branch:** `feature/admin-controls`
**Stems from:** `feature/TODO_kickstarter`
**Merge `feature/billet-pages` into this branch before starting** (to include billet page management)

### New Admin Sub-Routes

#### 4a. Qualifications (`/admin/qualifications`)
- Create, rename, delete qualifications
- Set category (Standard, Medical, Advanced, Aviation, Detachments, Leadership)
- Guard: `Qualifications` scope or Admin

#### 4b. Unit Elements (`/admin/unit-elements`)
- Create/rename/delete unit elements, set parent (hierarchical)
- Guard: Admin scope

#### 4c. Billets (`/admin/billets`)
- Create/edit/delete billets: unit element, superior billet, slug, priority
- Assign troopers to billets
- Guard: Admin scope

#### 4d. Departments (`/admin/departments`)
- Create/edit/delete departments and positions
- Set department scopes
- Guard: Admin scope

#### 4e. Announcements (`/admin/announcements`)
- Create, edit, delete homepage announcements
- Set category (News/Announcement), importance flag
- Guard: Admin or Mod scope

### Files to Create/Modify
- `src/app/admin/qualifications/page.tsx` + `_components/` + `_lib/`
- `src/app/admin/unit-elements/page.tsx` + `_components/` + `_lib/`
- `src/app/admin/billets/page.tsx` + `_components/` + `_lib/`
- `src/app/admin/departments/page.tsx` + `_components/` + `_lib/`
- `src/app/admin/announcements/page.tsx` + `_components/` + `_lib/`
- `src/app/admin/page.tsx` — Update index with links to sub-sections
- `src/services/` — Extend with admin CRUD operations as needed

---

## Task 5 — Medals / Commendations
**Branch:** `feature/medals`
**Stems from:** `feature/TODO_kickstarter`

### Design
- Medals displayed as a ribbon/badge grid on trooper profile (`/trooper/[id]`)
- Award dialog accessible to those with permission per the medal's settings
- Optional citation text when awarding

### New DB Tables
```sql
medals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  abbreviation VARCHAR(20),
  description TEXT,
  imageUrl TEXT,
  createdAt TIMESTAMP DEFAULT now()
)

trooper_medals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trooperId UUID NOT NULL REFERENCES troopers(id) ON DELETE CASCADE,
  medalId UUID NOT NULL REFERENCES medals(id),
  awardedById UUID REFERENCES troopers(id),
  awardedDate DATE NOT NULL DEFAULT now(),
  citation TEXT,
  createdAt TIMESTAMP DEFAULT now()
)
```

### Files to Create/Modify
- `src/db/schema.ts` — Add `medals`, `trooperMedals` tables
- `src/services/medals.ts` — Medal CRUD + award logic with permission checks
- `src/app/trooper/[id]/_components/MedalsSection.tsx` — Display medals on profile
- `src/app/trooper/[id]/_components/AwardMedalDialog.tsx` — Award dialog (permission-gated)
- `src/app/trooper/[id]/profile.tsx` — Integrate MedalsSection
- `src/app/admin/medals/page.tsx` — Admin page to create/manage medal definitions
- `src/app/api/v1/medals/route.ts` — API route for client-side fetching

---

## Task 6 — Wiki Pages
**Branch:** `feature/wiki`
**Stems from:** `feature/TODO_kickstarter`

### Design
- Route: `/wiki` (index) and `/wiki/[...slug]` (nested pages)
- Tree sidebar navigation (parent/child hierarchy)
- TipTap editor (already installed)
- Default: Admin-only create/edit; read access for all members

### New DB Table
```sql
wiki_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  content TEXT,  -- TipTap HTML
  parentId UUID REFERENCES wiki_pages(id),
  sortOrder INT DEFAULT 0,
  isPublished BOOLEAN DEFAULT true,
  createdById UUID REFERENCES troopers(id),
  updatedById UUID REFERENCES troopers(id),
  createdAt TIMESTAMP DEFAULT now(),
  updatedAt TIMESTAMP DEFAULT now()
)
```

### Files to Create/Modify
- `src/db/schema.ts` — Add `wikiPages` table (self-referential parentId)
- `src/services/wiki.ts` — Wiki CRUD with permission checks
- `src/app/wiki/page.tsx` — Wiki index (recently updated + tree nav)
- `src/app/wiki/[...slug]/page.tsx` — Dynamic wiki page view/edit
- `src/app/wiki/_components/WikiSidebar.tsx` — Tree navigation
- `src/app/wiki/_components/WikiEditor.tsx` — TipTap wrapper
- `src/app/api/v1/wiki/route.ts` — API route for wiki operations

---

## Task 7 — Discord Bot Integration
**Excluded from this plan.** The Discord bot is a separate repository. The Holocron webapp exposes data via its existing API routes which the bot can consume.

---

## Database Migration Strategy

Each feature branch runs its own migrations:
```bash
bun run db:generate    # after editing schema.ts
bun run db:push        # apply to local DB
bun run db:migrate:prod  # apply to production
```

Schema changes per branch:
| Branch | New Tables / Columns |
|--------|---------------------|
| `feature/homepage-revamp` | `announcements` table |
| `feature/billet-pages` | `billet_pages` table |
| `feature/google-calendar` | `campaign_events.googleCalendarEventId` column |
| `feature/admin-controls` | none (extends existing services) |
| `feature/medals` | `medals`, `trooper_medals` tables |
| `feature/wiki` | `wiki_pages` table |

---

## Verification Checklist

- **Homepage**: Stats pull from DB, BattleMetrics widget shows live data, events display, announcements render
- **Billet Pages**: Trooper with billet can edit `/billets/[slug]`, read-only for others
- **GCal**: Create campaign event → verify in Google Calendar; delete → verify removed
- **Admin Controls**: All CRUD works, permission gates block non-admin
- **Medals**: Award medal to trooper, verify profile display, unauthorized users blocked from awarding
- **Wiki**: Create page, tree nav updates, permission restriction works
