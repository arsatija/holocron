# Hierarchical Permissions System Guide

## Overview

The application now supports fine-grained, hierarchical permissions based on:

-   **Rank levels** (Enlisted, JNCO, SNCO, Company, Command)
-   **Department scopes** (Admin, Training, Recruitment, etc.)
-   **Billet slugs** (e.g., `cinder-1-1:lead`, `myth-hq:lead`)
-   **Department position slugs** (e.g., `training:lead`, `sgd-lore:2ic`)

## Key Features

### 1. Hierarchical Inheritance

**Superiors inherit all subordinate permissions** - leaders can access resources for their subordinates.

**Example:**

-   A user with `cinder-hq:lead` (Platoon Leader) automatically has access to resources protected by:

    -   `cinder-hq:lead` (their own position)
    -   `cinder-1:lead` (Squad Leader - subordinate)
    -   `cinder-1-1:lead` (Team Leader - subordinate's subordinate)
    -   `cinder-1-1:2ic` (Team 2IC - subordinate's subordinate)
    -   And all other subordinate positions in the chain

-   A user with `mod:lead` (Mod Lead) has access to:
    -   `mod:lead` (their own position)
    -   `mod:2ic` (subordinate position)

### 2. Stable Slugs

Permissions use human-readable slugs instead of database UUIDs, making them resilient to database changes.

### 3. Pre-Expanded Hierarchy

Hierarchy chains are expanded server-side when user logs in, keeping client-side permission checks fast and simple.

## Usage

### In Components

```tsx
import { ProtectedComponent } from "@/components/protected-component";
import { RankLevel } from "@/db/schema";

// Protect content with multiple permission types
<ProtectedComponent
    allowedPermissions={[
        "Admin", // Department scope
        RankLevel.Command, // Rank level
        "cinder-1-1:lead", // Specific billet
        "training:lead", // Department position
    ]}
    fallback={<p>Access denied</p>}
>
    <AdminPanel />
</ProtectedComponent>;
```

### In Routes

```tsx
import { ProtectedRoute } from "@/components/protected-route";

export default function AdminPage() {
    return (
        <ProtectedRoute
            allowedPermissions={["Admin", RankLevel.Command, "myth-hq:lead"]}
        >
            <AdminContent />
        </ProtectedRoute>
    );
}
```

### In Navigation

```tsx
import { ProtectedNavItem } from "@/components/protected-nav-item";

<ProtectedNavItem
    href="/training"
    allowedPermissions={["Training", "training:lead"]}
>
    <NavigationLink>Training</NavigationLink>
</ProtectedNavItem>;
```

## Slug Format

### Billet Slugs

Format: `{unit-element-slug}:{role-slug}`

Examples from `permission-scopes.yaml`:

-   `myth-hq:lead` - Myth HQ Leadership
-   `cinder-hq:lead` - Cinder Platoon Leader
-   `cinder-1:lead` - Cinder 1st Squad Leader
-   `cinder-1-1:lead` - Cinder 1-1 Team Leader
-   `cinder-1-1:2ic` - Cinder 1-1 Team 2IC
-   `stryx-hq:lead` - Stryx Squadron Leader
-   `grim-hq:lead` - Grim Lead

### Department Position Slugs

Format: `{department-slug}:{role-slug}`

Examples:

-   `training:lead` - Training Department Lead
-   `training-basic:lead` - Basic Training Lead
-   `sgd:lead` - SGD Department Lead
-   `sgd-lore:2ic` - SGD Lore Team 2IC
-   `admin:lead` - Admin Lead
-   `mod:lead` - Mod Lead

**Note:** Regular department members (non-leadership) don't need slugs. They inherit the overall department scope (e.g., "Admin", "Training") automatically.

## Setup & Maintenance

### 1. After Migration

Run the slug population script:

```bash
bun run populate-slugs.ts
```

This will:

-   Populate slug fields for existing billets and positions
-   Use mappings from `permission-scopes.yaml`
-   Skip non-leadership department positions (they stay null)
-   Report any unmapped positions for manual review

### 2. Adding New Positions

When creating new billets or department positions:

1. **Set the slug field** when creating the record
2. **Set superiorBilletId/superiorPositionId** to establish hierarchy
3. Test that hierarchy works correctly

Example:

```sql
-- New team within Cinder 1st Squad
INSERT INTO billets (role, slug, unit_element_id, superior_billet_id)
VALUES (
  'Team Leader',
  'cinder-1-3:lead',
  '{unit-element-id}',
  '{cinder-1-squad-leader-billet-id}'
);
```

### 3. Updating Organizational Structure

When org structure changes:

1. Update `superiorBilletId` or `superiorPositionId` relationships
2. The hierarchy cache will automatically refresh
3. Users will see updated permissions on next login (or when `revalidateTrooperCtx()` is called)

### 4. Cache Management

The permission system caches hierarchy chains for performance. The cache is:

-   **In-memory** on the server
-   **Automatically cleared** on server restart
-   **Can be manually cleared** by calling `clearHierarchyCache()` from `@/services/permissions`

## How It Works

### On User Login

1. System fetches user's assigned billet slug and position slugs
2. For each slug, **recursively finds all subordinates** (positions below them in hierarchy)
3. Stores complete hierarchy in `trooperCtx`:
    - `billetSlug`: User's actual billet (e.g., `"cinder-1:lead"`)
    - `billetPermissions`: Their position + all subordinates (e.g., `["cinder-1:lead", "cinder-1-1:lead", "cinder-1-1:2ic", "cinder-1-2:lead", ...]`)
    - `positionSlugs`: User's actual positions
    - `positionPermissions`: All position slugs + their subordinates combined

### On Permission Check

1. Component specifies `allowedPermissions`
2. System checks if ANY permission matches:
    - User's `rankLevel`
    - User's `departments` (scope array)
    - User's `billetPermissions` (hierarchy chain)
    - User's `positionPermissions` (hierarchy chains)
3. If any match, access granted

### On Assignment Change

When billet or position assignments change:

1. Server-side functions update database
2. Client calls `revalidateTrooperCtx()` if editing current user
3. Fresh trooperCtx is fetched with updated hierarchy
4. UI automatically reflects new permissions

## Examples

### Example 1: Team Leader Access

```tsx
// Only Team Leaders and their superiors can edit team roster
<ProtectedComponent allowedPermissions={["cinder-1-1:lead"]}>
    <EditTeamRoster team="1-1" />
</ProtectedComponent>
```

**Who has access:**

-   ✅ Cinder 1-1 Team Leader (`cinder-1-1:lead`)
-   ✅ Cinder 1st Squad Leader (`cinder-1:lead`) - superior
-   ✅ Cinder Platoon Leader (`cinder-hq:lead`) - superior's superior
-   ✅ Myth HQ Leadership (`myth-hq:lead`) - top of hierarchy
-   ❌ Cinder 1-2 Team Leader (`cinder-1-2:lead`) - different branch
-   ❌ Cinder 2nd Squad Leader (`cinder-2:lead`) - different branch

### Example 2: Training Management

```tsx
// Training directors and basic training leads can create trainings
<ProtectedComponent
    allowedPermissions={[
        "Training", // Any training department member via scope
        "training:lead", // Training director
        "training-basic:lead", // Basic training lead
    ]}
>
    <CreateTrainingButton />
</ProtectedComponent>
```

**Who has access:**

-   ✅ Anyone with Training department scope
-   ✅ Training Lead (`training:lead`)
-   ✅ Training 2IC (`training:2ic`) if superior is training:lead
-   ✅ Basic Training Lead (`training-basic:lead`)
-   ✅ All other training specialty leads
-   ❌ Regular troopers without training scope

### Example 3: Multi-Permission Access

```tsx
// Multiple ways to access admin panel
<ProtectedRoute
    allowedPermissions={[
        "Admin", // Admin department scope
        RankLevel.Command, // Command rank level
        "myth-hq:lead", // Myth HQ leadership billet
    ]}
>
    <AdminPanel />
</ProtectedRoute>
```

**Who has access:**

-   ✅ Anyone with Admin department assignment
-   ✅ Anyone with Command rank level
-   ✅ Myth HQ Leadership
-   ✅ Anyone matching ANY of the above

## Troubleshooting

### Permission Not Working

1. **Check trooperCtx**: Console log the user's context to see what permissions they have

```tsx
const { trooperCtx } = useController();
console.log(trooperCtx);
```

2. **Verify slug format**: Ensure slugs match exactly (case-sensitive)

3. **Check hierarchy**: Verify `superiorBilletId`/`superiorPositionId` relationships in database

4. **Revalidate context**: After assignment changes, ensure `revalidateTrooperCtx()` is called

### Hierarchy Not Expanding

1. **Check database relationships**: Verify superior IDs are set correctly
2. **Check slug existence**: Ensure all positions in chain have slugs
3. **Clear cache**: Restart server or call `clearHierarchyCache()`
4. **Check logs**: Server logs show hierarchy resolution process

### Permission Check Too Permissive/Restrictive

1. **Review hierarchy chain**: Check what's included in `billetPermissions`/`positionPermissions`
2. **Verify OR logic**: Remember that ANY matching permission grants access
3. **Check for null slugs**: Department members without leadership roles have null slugs (by design)

## API Reference

### Server Functions

-   `getBilletHierarchyChain(slug)` - Get full billet hierarchy
-   `getPositionHierarchyChain(slug)` - Get full position hierarchy
-   `getTrooperBilletSlug(trooperId)` - Get trooper's billet slug
-   `getTrooperPositionSlugs(trooperId)` - Get trooper's position slugs
-   `clearHierarchyCache()` - Clear in-memory hierarchy cache

### Client Functions

-   `checkPermissionsSync(userCtx, allowedPermissions)` - Synchronous permission check
-   `useController()` - Hook to access trooperCtx
-   `revalidateTrooperCtx()` - Force refresh of trooper context

### Components

-   `<ProtectedComponent>` - Conditional rendering based on permissions
-   `<ProtectedRoute>` - Route-level protection with redirect
-   `<ProtectedNavItem>` - Navigation item with permission check

## Migration Notes

### Backward Compatibility

The new system is **fully backward compatible**:

-   Existing `rankLevel` checks still work
-   Existing `departments` scope checks still work
-   New slug-based checks are additive

### Data Migration

1. Run Drizzle migration to add slug columns
2. Run `populate-slugs.ts` to populate existing records
3. Review and manually fix any warnings
4. Test permission system with various user roles
5. No code changes needed - existing permission checks continue working
