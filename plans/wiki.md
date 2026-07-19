# Plan: Wiki Feature (Outline-style Knowledge Base)

## Context

Add a wiki to the site, modeled on Outline (getoutline.com): **collections** contain a tree of **pages** (with arbitrarily nested subpages). Members read and write pages with the existing Tiptap editor. Permissions are enforced with the existing rank/scope/billet/position system (`checkPermissionsSync` + `trooperCtx`).

See also `plans/tech-debt.md` for app-wide issues surfaced during this plan's review (weak trooperCtx trust model, audit entity-type drift) that are being partially addressed here for wiki specifically, but need a full fix across the rest of the app separately.

Decisions already made by the owner (do not re-ask):

- **Permission granularity**: collection-level only. Each collection has a `readPermissions` array and an `editPermissions` array; all pages inherit them. No per-page overrides.
- **Collection creation/management**: `RankLevel.Command`, `admin:lead`, `admin:2ic` only.
- **Version history**: full revisions with browse + restore.
- **V1 features**: full-text search, drafts/publish state, page starring, internal page links with backlinks, and `@user` mentions that link to `/trooper/[id]`.
- **Editor**: reuse/extend the existing Tiptap editor (`src/components/tiptap/editor.tsx`) with markdown support.

## Codebase patterns to follow (read these first)

| Pattern | Reference |
|---|---|
| Schema conventions (uuid PKs, `$onUpdateFn` timestamps, cascade FKs) | `src/db/schema.ts` (see `campaigns`, `campaignPhases`, `auditLogs`) |
| Feature route structure: `page.tsx` + `_components/` + `_lib/{schema,queries,actions}.ts` | `src/app/admin/management/ranks/` |
| Server actions reading actor from `trooperCtx` cookie | `src/app/admin/management/ranks/_lib/actions.ts` |
| Service layer with audit logging | `src/services/campaigns.ts`, `src/services/audit.ts` |
| Client permission gating | `src/components/protected-route.tsx`, `protected-component.tsx`, `PERMISSIONS_GUIDE.md` |
| Trooper context shape | `src/contexts/controller.tsx` (`UserTrooperInfo`), populated by `/api/auth/trooper` |
| Tiptap editor + Cloudinary image upload | `src/components/tiptap/editor.tsx`, `src/lib/cloudinary-upload.ts` |
| Drag & drop (page tree reordering) | `@dnd-kit/*` already installed |
| Command palette UI (search) | `cmdk` already installed |

---

## 1. Database schema (`src/db/schema.ts`)

### `wikiCollections`

```ts
export const wikiCollections = pgTable("wiki_collections", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(), // url-safe, generated from name
    description: text("description").default(""),
    icon: varchar("icon", { length: 64 }),          // lucide icon name or emoji, optional
    order: integer("order").default(0).notNull(),   // sidebar sort
    readPermissions: jsonb("read_permissions").$type<string[]>().default([]).notNull(),
    editPermissions: jsonb("edit_permissions").$type<string[]>().default([]).notNull(),
    createdBy: uuid("created_by").references(() => troopers.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdateFn(() => new Date()).notNull(),
});
```

Permission array semantics (document in code comments):

- `readPermissions: []` → any logged-in member can read.
- `editPermissions: []` → anyone who can **read** can also edit.
- Non-empty arrays are checked with `checkPermissionsSync` (values are rank levels, department scopes, `qual:` strings, billet slugs, position slugs — same as everywhere else).
- Collection managers (`RankLevel.Command`, `admin:lead`, `admin:2ic`) always have full read/edit/admin access regardless of arrays.

### `wikiPages`

```ts
export const wikiPages = pgTable("wiki_pages", {
    id: uuid("id").primaryKey().defaultRandom(),
    collectionId: uuid("collection_id").notNull()
        .references(() => wikiCollections.id, { onDelete: "cascade" }),
    parentPageId: uuid("parent_page_id")
        .references((): AnyPgColumn => wikiPages.id, { onDelete: "cascade" }), // null = top-level in collection
    title: varchar("title", { length: 500 }).notNull(),
    content: text("content").default("").notNull(),       // Tiptap HTML (consistent with rest of app)
    contentText: text("content_text").default("").notNull(), // plain text extracted server-side on save, for search
    isPublished: boolean("is_published").default(false).notNull(),
    publishedAt: timestamp("published_at"),
    order: integer("order").default(0).notNull(),         // manual sort among siblings
    createdBy: uuid("created_by").references(() => troopers.id, { onDelete: "set null" }),
    lastEditedBy: uuid("last_edited_by").references(() => troopers.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdateFn(() => new Date()).notNull(),
}, (t) => [
    index("wiki_pages_collection_idx").on(t.collectionId),
    index("wiki_pages_parent_idx").on(t.parentPageId),
]);
```

Note the self-reference needs the `(): AnyPgColumn =>` typed callback (drizzle self-FK pattern). This is the first self-referencing FK in `schema.ts` — there's no existing example to copy in this codebase, so verify the generated migration carefully.

**Full-text search index**: this project's drizzle-orm (0.45.2) + drizzle-kit (0.31.10) *does* support this natively — no hand-editing required. Define a local `tsvector` custom type and a generated column directly in the schema object:

```ts
const tsVector = customType<{ data: string }>({
    dataType() { return "tsvector"; },
});

// inside wikiPages columns:
searchVector: tsVector("search_vector").generatedAlwaysAs(
    sql`setweight(to_tsvector('english', coalesce("title", '')), 'A') || setweight(to_tsvector('english', coalesce("content_text", '')), 'B')`,
),
```

...plus a GIN index in the table's index array: `index("wiki_pages_search_idx").using("gin", t.searchVector)`.

Verified: `bun run db:generate` emits a correct single migration — `"search_vector" "tsvector" GENERATED ALWAYS AS (...) STORED` inline in the `CREATE TABLE`, plus `CREATE INDEX ... USING gin ("search_vector")`. No manual SQL editing needed, and no drift risk between schema.ts and the DB since it's tracked like any other column. Query it with raw `sql` fragments (drizzle has no query-builder support for `@@`/`ts_rank`/etc.).

### `wikiPageRevisions`

```ts
export const wikiPageRevisions = pgTable("wiki_page_revisions", {
    id: uuid("id").primaryKey().defaultRandom(),
    pageId: uuid("page_id").notNull()
        .references(() => wikiPages.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 500 }).notNull(),
    content: text("content").notNull(),
    editedBy: uuid("edited_by").references(() => troopers.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [index("wiki_page_revisions_page_idx").on(t.pageId)]);
```

### `wikiPageStars`

```ts
export const wikiPageStars = pgTable("wiki_page_stars", {
    pageId: uuid("page_id").notNull()
        .references(() => wikiPages.id, { onDelete: "cascade" }),
    trooperId: uuid("trooper_id").notNull()
        .references(() => troopers.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [primaryKey({ columns: [t.pageId, t.trooperId] })]);
```

### `wikiPageLinks` (backlinks)

```ts
export const wikiPageLinks = pgTable("wiki_page_links", {
    sourcePageId: uuid("source_page_id").notNull()
        .references(() => wikiPages.id, { onDelete: "cascade" }),
    targetPageId: uuid("target_page_id").notNull()
        .references(() => wikiPages.id, { onDelete: "cascade" }),
}, (t) => [primaryKey({ columns: [t.sourcePageId, t.targetPageId] })]);
```

### Audit enum

Audit entity types are defined in **three places that must all be updated together** (confirmed out of sync with each other already — see `plans/tech-debt.md`):

1. The `auditEntityType` pgEnum in `src/db/schema.ts` (~line 95) — add `"wiki_collection"`, `"wiki_page"`.
2. The hand-written `AuditEntityType` TS union in `src/services/audit.ts` (~line 9) — add the same two.
3. `auditEntityTypeValues` in `src/lib/audit-constants.ts` — add the same two.

The generated migration must use `ALTER TYPE ... ADD VALUE` for the schema.ts enum change (drizzle-kit generates this for pgEnum additions; verify the SQL).

### Migration

`bun run db:generate` → hand-edit for `search_vector` (above) → `bun run db:migrate`. Also add drizzle-zod insert/select schemas at the bottom of `schema.ts` following the existing exports.

---

## 2. Server-side permission enforcement

Wiki content can be restricted (leadership-only collections), and pages render in **server components**, so read filtering must happen server-side — the existing client-only `ProtectedRoute` pattern is not enough here.

Create `src/services/wiki-permissions.ts`:

```ts
"use server" // or plain server module imported only from server code
```

- `getTrooperCtx(): Promise<UserTrooperInfo | null>` — **decided**: do NOT trust the `trooperCtx` cookie for wiki. It's client-writable and unsigned (confirmed: `getActorId()` in `src/app/admin/management/ranks/_lib/actions.ts` currently trusts it directly with no session check — that's an existing app-wide weakness, not something to replicate here). Instead:
  - Extract the ctx-building logic from `src/app/api/auth/trooper/route.ts:20-27` into a reusable `buildTrooperCtx(sessionUserId)` function (new home: `src/services/trooper-ctx.ts` or similar — check for an existing service module to extend before creating a new file).
  - `getTrooperCtx()` gets the NextAuth session server-side (`auth()`/`getServerSession()` per whatever this project's NextAuth setup uses) and calls `buildTrooperCtx(session.user.id)`.
  - Use this for **every** wiki server action and every restricted-collection server-component read. No cookie parsing in the wiki code path at all.
- `const WIKI_MANAGER_PERMISSIONS = [RankLevel.Command, "admin:lead", "admin:2ic"]`
- `canManageWiki(ctx)` → `checkPermissionsSync(ctx, WIKI_MANAGER_PERMISSIONS)`
- `canReadCollection(ctx, collection)` → manager, or `readPermissions.length === 0`, or `checkPermissionsSync(ctx, readPermissions)`
- `canEditCollection(ctx, collection)` → manager, or (`editPermissions.length === 0` && canRead), or `checkPermissionsSync(ctx, editPermissions)`
- `getReadableCollections(ctx)` → fetch all collections, filter with `canReadCollection` (collection count is small; in-memory filter is fine and is the only way to reuse `checkPermissionsSync`).

Every server action and every server-component query must go through these. Client-side `ProtectedComponent`/conditional rendering is for UX only.

---

## 3. Service layer (`src/services/wiki.ts`)

`"use server"` module following `src/services/campaigns.ts` conventions. All mutations take `actorId` and write audit logs via `createAuditLog` (`src/services/audit.ts`) with the new entity types.

Collections:
- `getWikiCollections()` / `getWikiCollectionBySlug(slug)`
- `createWikiCollection(input, actorId)` — generate slug from name (kebab-case, dedupe with suffix)
- `updateWikiCollection(id, input, actorId)` — name change regenerates slug only if explicitly requested (avoid breaking URLs); simplest: keep slug stable after creation
- `deleteWikiCollection(id, actorId)` — cascades pages; audit with `previousData`

Pages:
- `getCollectionPageTree(collectionId, { includeDrafts })` — all pages in collection (id, title, parentPageId, order, isPublished only — no content), assembled into a tree in JS
- `getWikiPage(pageId)` — full row + creator/editor names
- `createWikiPage({ collectionId, parentPageId, title }, actorId)` — starts as draft (`isPublished: false`), `order` = max sibling order + 1
- `updateWikiPage(pageId, { title, content }, actorId)`:
  1. Snapshot current title/content into `wikiPageRevisions` **before** updating (skip if content and title are unchanged)
  2. Update page; derive `contentText` by stripping HTML tags server-side (simple regex strip + entity decode is sufficient for search)
  3. Re-extract internal links: parse `content` for `href` values matching `/wiki/{collectionSlug}/{pageId}` (regex on the HTML is fine) and links inserted by the page-link feature (they carry `data-wiki-page-id` — see §5); replace all `wikiPageLinks` rows for this source page
- `publishWikiPage(pageId, actorId)` / `unpublishWikiPage(pageId, actorId)`
- `moveWikiPage(pageId, { parentPageId, order, collectionId }, actorId)` — reparent/reorder; reject moves that would create a cycle (walk ancestors)
- `deleteWikiPage(pageId, actorId)` — cascades subpages; audit with `previousData`

Revisions:
- `getPageRevisions(pageId)` — list (id, title, editedBy name, createdAt), no content
- `getPageRevision(revisionId)` — full content
- `restorePageRevision(pageId, revisionId, actorId)` — snapshots current state as a new revision, then applies the old one

Stars:
- `toggleWikiPageStar(pageId, trooperId)` / `getStarredPages(trooperId)`

Search:
- `searchWikiPages(query, readableCollectionIds)`:

```ts
sql`SELECT id, title, collection_id,
      ts_headline('english', content_text, websearch_to_tsquery('english', ${query}),
                  'MaxWords=20, MinWords=10') AS snippet,
      ts_rank(search_vector, websearch_to_tsquery('english', ${query})) AS rank
    FROM wiki_pages
    WHERE search_vector @@ websearch_to_tsquery('english', ${query})
      AND collection_id IN (...)
      AND is_published = true   -- also include drafts for collections the user can edit
    ORDER BY rank DESC LIMIT 20`
```

Backlinks:
- `getPageBacklinks(pageId)` — join `wikiPageLinks` → `wikiPages` where target = pageId, published only

Mentions:
- `searchTroopersForMention(query)` — **confirmed: no existing query-driven search to reuse.** `src/services/troopers.ts` only has `getTroopersAsOptions()`, which returns all non-discharged troopers unfiltered. Build this from scratch: `ilike` on name, limit 10, return `{ id, fullName, rank abbreviation }`.

---

## 4. Routes (`src/app/wiki/`)

```
src/app/wiki/
├── layout.tsx                     # Shell: WikiSidebar + content area. Client gate: ProtectedRoute
│                                  # with [] (any logged-in member); per-collection checks are server-side
├── page.tsx                       # Wiki home: starred pages, recently updated, collection cards
├── search/page.tsx                # Full search results page (?q=) — search dialog links here
├── [collectionSlug]/
│   ├── page.tsx                   # Collection home: description + page tree. 404/redirect if not readable
│   └── [pageId]/
│       ├── page.tsx               # Page view (server component): renders content read-only,
│       │                          # breadcrumbs, star button, backlinks panel, Edit button (if canEdit),
│       │                          # draft banner (if unpublished)
│       ├── edit/page.tsx          # Editor page (canEdit only): title input + WikiEditor,
│       │                          # save / publish controls
│       └── history/page.tsx       # Revision list + side-by-side viewer + Restore button
├── _components/
│   ├── wiki-sidebar.tsx           # Collections (readable only) → expandable page tree; starred section;
│   │                              # search trigger; "New collection" (managers only, ProtectedComponent)
│   ├── page-tree.tsx              # Recursive tree; dnd-kit drag to reorder/reparent (editors only);
│   │                              # context menu: new subpage, rename, delete, publish
│   ├── collection-form-dialog.tsx # Create/edit collection: name, description, icon,
│   │                              # read/edit permission builders
│   ├── permission-select.tsx      # Multi-select for permission strings: rank levels (enum),
│   │                              # department scopes, billet/position slugs (fetched), free-text entry
│   ├── wiki-page-editor.tsx       # Client wrapper for edit page: title, WikiEditor, save state,
│   │                              # Ctrl+S handler, publish/unpublish, delete
│   ├── star-button.tsx
│   ├── backlinks-panel.tsx
│   ├── revision-history.tsx
│   ├── wiki-search-dialog.tsx     # cmdk dialog, debounced searchAction, Ctrl+K within /wiki
│   └── wiki-breadcrumbs.tsx
└── _lib/
    ├── schema.ts                  # zod: collectionFormSchema, pageFormSchema, movePageSchema, etc.
    ├── queries.ts                 # server-component data fetchers (wrap services + permission filters)
    └── actions.ts                 # server actions; every one loads ctx and enforces permissions
                                   # before delegating to src/services/wiki.ts
```

Route behavior details:

- **Page view** renders the stored HTML through the same read-only Tiptap path used elsewhere (`TiptapEditor editable={false}`) or a sanitized `dangerouslySetInnerHTML` with the `tiptap-readonly` styles — prefer the read-only editor for styling parity.
- **Drafts**: page view of an unpublished page 404s for read-only users; editors see it with a "Draft" banner and Publish button. Page tree shows drafts (dimmed/badged) only to editors.
- **Deletes** (page with children, collection) get an AlertDialog confirm listing consequences.
- **Not-found/denied**: use `notFound()` rather than leaking existence of restricted collections.

---

## 5. Editor: `src/components/tiptap/wiki-editor.tsx`

Extend, don't fork: refactor `editor.tsx` minimally so the extension list can be augmented via an `extensions?: Extension[]` prop (keep the default export's behavior byte-identical for existing callers — announcements, campaign story, bios, etc.).

`WikiEditor` = base editor + additional extensions:

1. **Markdown support** — StarterKit already provides markdown input rules (`#`, `**`, `-`, ` ``` `, `>` etc.). Add:
   - **Confirmed neither `@tiptap/markdown` nor `tiptap-markdown` is currently installed** (project is on `@tiptap/*@^3.20.1`). Check `tiptap-markdown`'s compatibility with Tiptap v3 before adding — if it's unmaintained/v2-only, drop markdown-paste from v1 scope rather than forcing it; StarterKit's native input rules already cover typed markdown shortcuts. Storage stays HTML either way.
2. **@user mentions** — `@tiptap/extension-mention` **(not currently installed — add as a new dependency)** with a suggestion popup (follow Tiptap's suggestion + React renderer docs). Query via `searchTroopersForMention` server action. Render as a link node/attrs pointing to `/trooper/{trooperId}` so mentions work in read-only view (styled chip, e.g. `text-primary bg-primary/10 rounded px-1`).
3. **Internal page links** — second Mention-style instance triggered by `[[`, searching pages within collections the user can read (server action reuses the FTS search on title). Inserts a link with `href=/wiki/{collectionSlug}/{pageId}` and `data-wiki-page-id={pageId}` (the attribute is what link-extraction on save reads).
4. **Link extension** — verify StarterKit v3 includes Link (it does in v3); ensure it's enabled and styled in `tiptap.css`.
5. Keep Cloudinary image paste/drop from the base editor.

Add toolbar entries only if trivial; slash-commands are **out of scope** for v1.

---

## 6. Navigation

- `src/components/nav-main.tsx`: add a top-level "Wiki" item (visible to all logged-in members — no permission wrapper needed, or `ProtectedNavItem` with `[]`).
- `src/components/nav-bar.tsx` (mobile): same.
- Optional: wiki search dialog registers Ctrl+K only within the wiki layout to avoid clobbering any global shortcut.

---

## 7. Execution order (phases = commits)

1. **Schema + migration**: tables, audit enum values, hand-edited FTS migration, drizzle-zod exports. Run `bun run db:generate` + `db:migrate` locally.
2. **Permissions + services**: `wiki-permissions.ts`, `wiki.ts` (collections + pages + revisions CRUD, audit logging).
3. **Collections UI**: layout + sidebar shell, wiki home, collection CRUD dialog with permission-select, collection page.
4. **Pages**: page tree (create/rename/delete/expand), page view, edit page with plain `TiptapEditor`, drafts + publish flow, breadcrumbs.
5. **Editor upgrades**: `WikiEditor` — markdown paste, mentions, `[[` page links; link extraction + backlinks panel.
6. **Revisions**: history page, restore flow.
7. **Stars + search**: star button + sidebar section; FTS server action, cmdk dialog, search page.
8. **Nav + polish**: nav entries, empty states, loading states, mobile pass, `TODO.md` note.

Each phase should build (`bun run build` or at least `next lint` + tsc) before moving on.

---

## 8. Verification checklist (manual, with dev server)

- Non-manager member: cannot see "New collection"; cannot open a restricted collection by URL (404), cannot call its server actions (test by direct action invocation returns error).
- Collection with `readPermissions: ["Training"]`, `editPermissions: ["training:lead"]`: training member can read not edit; training lead can edit; Command sees everything.
- Empty edit permissions → readers can edit.
- Create page → starts draft, invisible to a read-only user until published.
- Edit page 3 times → 3 revisions; restore the first → content reverts and a 4th revision (pre-restore snapshot) exists.
- `[[` link page A→B → B's page shows A in backlinks; delete A → backlink gone.
- `@mention` a trooper → renders as chip linking to their profile in read-only view.
- Search finds words in body text, respects collection read permissions, excludes drafts for non-editors.
- Drag a page onto another page → becomes subpage; cycle attempt (parent into its own child) rejected.
- Deleting a collection removes its pages, revisions, stars, links (cascade).
- Audit log shows wiki_collection / wiki_page entries with actor.

## Out of scope (v1)

Real-time collaborative editing (would need Hocuspocus/websockets), page templates, comments, public sharing links, file attachments beyond images, slash-command menu, import/export of whole collections.
