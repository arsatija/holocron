# Plan: Admin Management Pages

## Context
Members with elevated roles (Command rank, or billet slugs `admin:2ic` / `admin:lead`) currently have to go directly into the database to manage core reference data: ranks, departments, unit elements, billet positions, and department positions. This plan adds a protected management section inside the existing `/admin` area so these records can be created, edited, and deleted from the web app.

---

## Permissions
All management pages gate behind:
```ts
allowedPermissions: [RankLevel.Command, "admin:2ic", "admin:lead"]
```
Applied via `<ProtectedRoute>` in a shared layout at `/admin/management/layout.tsx`.

The existing `/admin/layout.tsx` already handles the outer Company/Command/Admin gate; the new layout adds the stricter inner gate.

---

## Route Structure

```
src/app/admin/management/
├── layout.tsx                  # ProtectedRoute — Command | admin:2ic | admin:lead
├── page.tsx                    # Landing: links/cards to each section
├── ranks/
│   ├── page.tsx
│   ├── _components/
│   │   ├── ranks-table.tsx     # TanStack + DataTable (existing component)
│   │   ├── rank-columns.tsx    # Column defs with edit/delete row actions
│   │   └── rank-form.tsx       # Create/edit dialog form
│   └── _lib/
│       ├── schema.ts           # Zod schemas
│       ├── queries.ts          # getRanks() with unstable_cache
│       └── actions.ts          # createRank, updateRank, deleteRank server actions
├── departments/
│   ├── page.tsx
│   ├── _components/
│   │   ├── departments-tree.tsx     # Recursive indented tree
│   │   └── department-form.tsx      # Create/edit — includes parentId combobox
│   └── _lib/
│       ├── schema.ts
│       ├── queries.ts
│       └── actions.ts
├── department-positions/
│   ├── page.tsx
│   ├── _components/
│   │   ├── positions-table.tsx      # Filtered by selected department
│   │   └── position-form.tsx        # Includes departmentId + superiorPositionId
│   └── _lib/
│       ├── schema.ts
│       ├── queries.ts
│       └── actions.ts
├── unit-elements/
│   ├── page.tsx
│   ├── _components/
│   │   ├── unit-elements-tree.tsx   # Recursive indented tree (same pattern as departments)
│   │   └── unit-element-form.tsx
│   └── _lib/
│       ├── schema.ts
│       ├── queries.ts
│       └── actions.ts
└── billets/
    ├── page.tsx
    ├── _components/
    │   ├── billets-table.tsx         # Filtered by selected unit element
    │   └── billet-form.tsx           # Includes unitElementId + superiorBilletId
    └── _lib/
        ├── schema.ts
        ├── queries.ts
        └── actions.ts
```

---

## Navigation

### Desktop (`src/components/nav-main.tsx`)
Extend the existing Admin `NavigationMenuContent` to use a two-column hover layout — the same pattern already used by the Training dropdown:

- **Left column**: Operations, Audit Log, Management (with `ChevronRight` icon)
- **Right column**: appears when hovering "Management" → shows the 5 sub-page links (Ranks, Departments, Unit Elements, Billets, Department Positions)

State: `const [showManagement, setShowManagement] = useState(false)` toggled by `onMouseEnter`/`onMouseLeave` on the Management row.

Management items are only rendered if `canManagement` is true:
```ts
const canManagement = checkPermissionsSync(trooperCtx, [RankLevel.Command, "admin:2ic", "admin:lead"]);
```

Clicking the "Management" label itself navigates to `/admin/management` (the landing page).

### Mobile (Sheet menu in `src/components/nav-bar.tsx`)
Add Management sub-links as indented items below Admin in the mobile sheet — only visible if `canManagement`. Since the sheet is a flat list, render them as slightly indented `Link` entries under a "Management" header label.

### Secondary nav inside the management section
Inside `/admin/management/layout.tsx`, render a horizontal pill/tab nav linking to all 5 sub-pages, so users can jump between sections without going back through the dropdown.

---

## Service Layer

Create or extend service files in `src/services/`:

| File | Operations |
|------|------------|
| `ranks.ts` | `getRanks`, `createRank`, `updateRank`, `deleteRank` |
| `departments.ts` | Extend existing with `createDepartment`, `updateDepartment`, `deleteDepartment` |
| `departmentPositions.ts` | `getDepartmentPositions`, `createDepartmentPosition`, `updateDepartmentPosition`, `deleteDepartmentPosition` |
| `unitElements.ts` | `getUnitElements`, `createUnitElement`, `updateUnitElement`, `deleteUnitElement` |
| `billets.ts` | `getBillets`, `createBillet`, `updateBillet`, `deleteBillet` |

Each mutation must call `revalidateTag()` and `createAuditLog()` — matching the pattern in `src/services/events.ts`.

---

## UI Patterns per Section

### Ranks (`/admin/management/ranks`)
- Flat `DataTable` (existing component at `src/components/data-table/data-table.tsx`)
- Columns: Grade, Name, Abbreviation, Rank Level, Order, Next Rank
- Row actions: Edit (dialog) / Delete (confirmation dialog)
- Create button opens same form dialog in create mode
- `order` field is a number input; `rankLevel` is a Select from the `rankLevel` enum; `nextRankId` is a combobox of existing ranks

### Departments (`/admin/management/departments`)
- Recursive tree component (`departments-tree.tsx`) that sorts by `priority`, indents children under parents
- Each row has: icon, name, scopes badges, parent, edit/delete inline buttons
- "Add Department" button at top; "Add Sub-department" button on each row to pre-fill `parentId`
- Form includes: name, description, icon, parentId (combobox), priority, departmentScopes (multi-select from enum)

### Department Positions (`/admin/management/department-positions`)
- Department selector combobox at the top (client state)
- Below: flat `DataTable` of positions for the selected department
- Columns: Role, Slug, Superior Position, Priority
- Form includes: role, slug, departmentId (pre-filled from selector), superiorPositionId (combobox of positions in same dept), priority

### Unit Elements (`/admin/management/unit-elements`)
- Same recursive tree pattern as departments
- Each row: icon, name, radio, parent, priority, edit/delete
- Form includes: name, icon, parentId (combobox), priority, radio

### Billets (`/admin/management/billets`)
- Unit element selector combobox at top (client state)
- Below: flat `DataTable` of billets for the selected unit element
- Columns: Role, Slug, Superior Billet, Priority
- Form includes: role, slug, unitElementId (pre-filled), superiorBilletId (combobox of billets in same unit element), priority

---

## Tree Component Design

`departments-tree.tsx` and `unit-elements-tree.tsx` share the same recursive pattern:

```tsx
// Build a tree from flat list using parentId
function buildTree<T extends { id: string; parentId: string | null }>(items: T[]): TreeNode<T>[]

// Render with indentation
function TreeRow({ node, depth }: { node: TreeNode<T>, depth: number }) {
  // pl-{depth * 4} for visual indent
  // Inline edit/delete buttons
  // Expandable/collapsible rows
}
```

Since both trees have the same shape (id, name, icon, parentId, priority), extract a generic `<EntityTree>` component in `src/app/admin/management/_components/entity-tree.tsx` that both pages use.

---

## Zod Schema Examples

```ts
// ranks schema
export const rankFormSchema = z.object({
  id: z.number().optional(),
  grade: z.string().max(10).optional(),
  name: z.string().min(1).max(100),
  abbreviation: z.string().max(10).optional(),
  rankLevel: z.enum(rankLevelEnum.enumValues),
  order: z.number().int().optional(),
  nextRankId: z.number().int().optional().nullable(),
});

// department schema
export const departmentFormSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  icon: z.string().optional(),
  parentId: z.string().uuid().optional().nullable(),
  priority: z.number().int().default(-1),
  departmentScopes: z.array(z.enum(departmentScopeEnum.enumValues)).default([]),
});
```

---

## Server Action Pattern (consistent with existing)

```ts
"use server"
export async function createRank(input: z.infer<typeof rankFormSchema>) {
  const data = rankFormSchema.parse(input);
  const actorId = await getActorId(); // from cookies, same helper as roster actions
  await rankService.createRank(data, actorId);
}
```

---

## Implementation Order

1. `layout.tsx` + `page.tsx` (landing) + nav bar entry
2. **Ranks** — simplest (flat, no hierarchy)
3. **Departments** — introduces tree component + shared `<EntityTree>`
4. **Unit Elements** — reuses `<EntityTree>` from step 3
5. **Department Positions** — introduces the "select parent entity → filter table" pattern
6. **Billets** — reuses the filter pattern from step 5

---

## Verification
- Log in as a Command-rank user → "Management" appears in Admin dropdown nav
- Log in as an Enlisted user → "Management" does not appear; navigating directly → redirected
- Ranks page: create a rank → appears in list; edit → updates; delete → removed; check roster sort still works
- Departments page: create parent dept → create child dept under it → tree shows indented; check trooper department assignments still work
- Billets page: select unit element → create billet → appears filtered; check ORBAT still renders
- Audit log: verify create/update/delete actions appear for all entities
