# Rank Replacement Plan

Replace the static `ranks` constant in `src/lib/definitions.ts` with database-sourced data so the DB is the single source of truth.

## Usages of `ranks` from `definitions.ts`

| File | Usage | Replace? | Effort |
|---|---|---|---|
| `src/app/roster/_lib/actions.ts:47` | `.max(Object.keys(ranks).length)` | Yes — use `.max(25)` or drop it | Low |
| `src/app/roster/_components/trooper-form.tsx:86` | Same pattern | Yes — same fix | Low |
| `src/app/roster/_components/players-table-columns.tsx:59` | `ranks[rank].name` for table display | Yes — join rank in trooper query | Medium |
| `src/lib/utils.ts:103,117` | `ranks[trooper.rank].abbreviation` in `getFullTrooperName` / `getShortTrooperName` | Yes — join rank in trooper query, update all callers | High |

## What Already Exists

- `src/db/schema.ts` — `ranks` pgTable with `id`, `grade`, `name`, `abbreviation`, `rankLevel`, `nextRankId`
- `src/services/ranks.ts` — `getRanks()`, `getRanksAsOptions()`, `getRank(rankId)` already query the DB
- `src/app/api/v1/ranksList/route.ts` — API endpoint returning rank options from DB
- No Drizzle `relations()` defined between `troopers` and `ranks` in `schema.ts`

## Implementation Steps

### Step 1: Low-effort validation fixes
- `src/app/roster/_lib/actions.ts:47` — replace `z.number().min(1).max(Object.keys(ranks).length)` with `.max(25)` or remove `.max()` entirely (DB FK handles invalid IDs)
- `src/app/roster/_components/trooper-form.tsx:86` — same change
- Remove the `ranks` import from both files

### Step 2: Add Drizzle relation for troopers → ranks
In `src/db/schema.ts`, add:
```ts
export const troopersRelations = relations(troopers, ({ one }) => ({
    rankData: one(ranks, {
        fields: [troopers.rank],
        references: [ranks.id],
    }),
}));
```

### Step 3: Update trooper queries to eager-load rank data
In `src/services/troopers.ts`, update `getTroopers()` and `getTrooper()` to use `with: { rankData: true }` so the returned trooper objects include `rankData: { abbreviation, name, ... }`.

Note: This changes the `Trooper` type shape — callers will need to be updated.

### Step 4: Update `getFullTrooperName` / `getShortTrooperName` in `utils.ts`
Change signatures to accept `abbreviation: string` directly instead of `rank: number`:
```ts
// Before
getFullTrooperName(trooper: { rank: number; numbers: number; name: string })

// After
getFullTrooperName(trooper: { abbreviation: string; numbers: number; name: string })
```

These functions are called from ~15 places — all callers will already have the joined rank data after Step 3:
- `src/services/troopers.ts:40`
- `src/services/attendances.ts:170`
- `src/services/trainings.ts:68`
- `src/app/qualifications/[qualificationId]/page.tsx:240`
- `src/app/auth/login/page.tsx:36`
- `src/app/qualifications/[qualificationId]/training/[trainingId]/page.tsx:180,206`
- `src/app/trooper/[id]/profile.tsx:236,274`
- `src/app/roster/_components/players-table-columns.tsx` (also covers Step 5)
- `src/app/orbat/_lib/queries.ts:197,371`
- `src/app/admin/_components/operations-table-columns.tsx:71,93,118`
- `src/app/api/auth/trooper/route.ts:33`
- `src/app/campaigns/[campaignId]/events/[eventId]/page.tsx:291,315,524`
- `src/app/training/_lib/queries.ts`
- `src/app/training/_components/trainings-table-columns.tsx:86,108`

### Step 5: Update `players-table-columns.tsx` table accessor
```ts
// Before
accessorFn: (row) => ranks[row.rank].name

// After
accessorFn: (row) => row.rankData.name
```

### Step 6: Delete `ranks` from `definitions.ts`
Once all imports are removed, delete the `ranks` constant (and `unit_dict` type if unused).
