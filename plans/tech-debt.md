# Tech Debt & Security Backlog

Issues surfaced while reviewing `plans/wiki.md` (2026-07-18) that are app-wide, not wiki-specific. The wiki plan works around some of these locally (see cross-references) but the underlying issues remain everywhere else.

---

## 1. Weak authorization: `trooperCtx` cookie is trusted directly by server actions

**What's wrong**: `UserTrooperInfo` (the object every permission check runs against) is built server-side from the NextAuth session in `src/app/api/auth/trooper/route.ts`, then handed to the client and stored in a plain cookie via `cookies-next` (`src/contexts/controller.tsx`). That cookie is **not signed and not httpOnly** — it's set client-side with default options. Server actions then read it back and trust it as-is, with no session re-verification:

- `getActorId()` in `src/app/admin/management/ranks/_lib/actions.ts:8-17` — `JSON.parse`s the cookie, no signature/session check.
- This is the pattern used across the app wherever a server action needs to know who's acting and what they're allowed to do.

**Impact**: a client can edit the `trooperCtx` cookie value directly (e.g. via browser devtools) and potentially escalate rank/department/billet claims before a server action reads them, bypassing `checkPermissionsSync` gates. Severity depends on how many mutating server actions rely on cookie-derived ctx rather than re-deriving from the session — that inventory hasn't been done yet.

**Where this is being partially addressed**: the wiki plan (`plans/wiki.md`, §2) builds a session-derived `buildTrooperCtx(sessionUserId)` / `getTrooperCtx()` for all wiki server actions and restricted-collection reads, instead of trusting the cookie. That's scoped to wiki only.

**Fix for the rest of the app**:
- Extract `buildTrooperCtx(sessionUserId)` (wiki will already do this) into a shared, reusable location.
- Audit existing server actions/services for cookie-trust reads (`getActorId()` and similar) and migrate them to the session-derived version.
- Decide whether the cookie is still needed client-side for UI-only gating (`ProtectedRoute`/`ProtectedComponent`) — that's a legitimate lower-stakes use as long as nothing security-relevant reads it server-side.

**Why not fixed now**: app-wide migration touches every existing feature's server actions (ranks, campaigns, admin management, etc.) — too large to bundle into the wiki feature branch. Do as a dedicated security pass.

---

## 2. Audit entity types are out of sync across three locations

**What's wrong**: `AuditEntityType`/entity-type values are defined independently in three places and have already drifted:

- pgEnum `auditEntityType` in `src/db/schema.ts` (~line 95)
- hand-written `AuditEntityType` TS union in `src/services/audit.ts` (~line 9)
- `auditEntityTypeValues` in `src/lib/audit-constants.ts`

The first two already include `rank`, `department`, `department_position`, `unit_element`, `billet`, `medal`, `trooper_medal`, which `audit-constants.ts` is missing. Nothing enforces the three stay identical — a value could be usable at the DB/service level but rejected or mismatched wherever `audit-constants.ts` is the source of truth (e.g. UI filters), or vice versa.

**Where this is being partially addressed**: the wiki plan now updates all three when adding `wiki_collection`/`wiki_page` (see `plans/wiki.md`, "Audit enum" section), so wiki won't add new drift — but the *existing* drift for the entries listed above is untouched.

**Fix**: pick one source of truth (likely the pgEnum, since it's DB-authoritative) and derive the other two from it, or at minimum add a lint/test that fails if the three lists diverge. Backfill `audit-constants.ts` with the missing values as a small standalone cleanup.

---

## 3. `UserTrooperInfo` type is duplicated, not shared

**What's wrong**: the type is defined identically (copy-pasted, not imported) in both `src/contexts/controller.tsx:14-25` and `src/lib/permissions.ts:3-14`. Two independent definitions of the same shape will silently drift if one is updated and the other isn't.

**Fix**: move the type to one module (likely `src/lib/permissions.ts` since it's the lower-level/server-safe location) and import it from `controller.tsx`.

---

## 4. `ProtectedNavItem` exists but isn't used

**What's wrong**: `src/components/protected-nav-item.tsx` implements a wrapper matching the documented pattern in `PERMISSIONS_GUIDE.md`, but `src/components/nav-main.tsx` and `src/components/nav-bar.tsx` both gate items with inline `checkPermissionsSync(...)` calls instead. Not a bug, but it's dead code sitting next to the pattern nobody follows — either adopt it or remove it so the guide matches reality.

**Fix**: low priority. Worth a pass when nav is next touched (the wiki plan adds a nav entry but doesn't need permission gating, so it won't resolve this either way).
