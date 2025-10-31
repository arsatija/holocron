# Hierarchical Billet Permissions - Implementation Summary

## ✅ What Was Implemented

### 1. Database Schema Changes

-   ✅ Added `slug` field to `billets` table (varchar, unique, nullable)
-   ✅ Added `slug` field to `departmentPositions` table (varchar, unique, nullable)

**Files Modified:**

-   `src/db/schema.ts`

### 2. Slug Population Script

-   ✅ Created `populate-slugs.ts` script
-   ✅ Maps slugs from `permission-scopes.yaml`
-   ✅ Handles billets and department positions
-   ✅ Skips non-leadership positions (they inherit department scope)
-   ✅ Reports unmapped positions for manual review

**Files Created:**

-   `populate-slugs.ts`

### 3. Permissions Service (Hierarchy Resolution)

-   ✅ `getBilletHierarchyChain(slug)` - Walks up `superiorBilletId` chain
-   ✅ `getPositionHierarchyChain(slug)` - Walks up `superiorPositionId` chain
-   ✅ In-memory caching for performance
-   ✅ `clearHierarchyCache()` utility function

**Files Created:**

-   `src/services/permissions.ts`

### 4. Service Functions

-   ✅ `getTrooperBilletSlug(trooperId)` - Get user's assigned billet slug
-   ✅ `getTrooperPositionSlugs(trooperId)` - Get user's assigned position slugs (filters nulls)

**Files Modified:**

-   `src/services/billets.ts`
-   `src/services/departments.ts`

### 5. Auth API Enhancement

-   ✅ Fetches billet and position slugs on login
-   ✅ Expands hierarchy chains server-side
-   ✅ Includes expanded permissions in `trooperCtx`:
    -   `billetSlug` - User's actual billet
    -   `positionSlugs` - User's actual positions
    -   `billetPermissions` - Full hierarchy chain (includes superiors)
    -   `positionPermissions` - Combined position chains

**Files Modified:**

-   `src/app/api/auth/trooper/route.ts`

### 6. Context Type Updates

-   ✅ Updated `UserTrooperInfo` interface with new fields:
    -   `billetSlug: string | null`
    -   `positionSlugs: string[]`
    -   `billetPermissions: string[]`
    -   `positionPermissions: string[]`

**Files Modified:**

-   `src/contexts/controller.tsx`

### 7. Permission Check Utility

-   ✅ `checkPermissionsSync()` function
-   ✅ Checks rank, departments, billet permissions, and position permissions
-   ✅ Simple direct match (hierarchy pre-expanded)
-   ✅ TypeScript type safety

**Files Created:**

-   `src/lib/permissions.ts`

### 8. API Endpoints (For Future Use)

-   ✅ `/api/v1/permissions/check-billet` - Check billet hierarchy
-   ✅ `/api/v1/permissions/check-position` - Check position hierarchy

**Files Created:**

-   `src/app/api/v1/permissions/check-billet/route.ts`
-   `src/app/api/v1/permissions/check-position/route.ts`

### 9. Protected Components Updated

-   ✅ `ProtectedComponent` - Now uses `checkPermissionsSync()`
-   ✅ `ProtectedRoute` - Now uses `checkPermissionsSync()`
-   ✅ `ProtectedNavItem` - Now uses `checkPermissionsSync()`

**Files Modified:**

-   `src/components/protected-component.tsx`
-   `src/components/protected-route.tsx`
-   `src/components/protected-nav-item.tsx`

### 10. Documentation

-   ✅ Comprehensive permissions guide
-   ✅ Usage examples
-   ✅ Troubleshooting section
-   ✅ API reference

**Files Created:**

-   `PERMISSIONS_GUIDE.md`
-   `IMPLEMENTATION_SUMMARY.md` (this file)

### 11. Revalidation

-   ✅ Existing `revalidateTrooperCtx()` already handles updates
-   ✅ Called in trooper form when editing current user
-   ✅ Automatically refreshes permissions on assignment changes

**Files Verified:**

-   `src/app/roster/_components/trooper-form.tsx` (line 268)
-   `src/app/roster/_lib/actions.ts`

## 📋 What You Need To Do

### Step 1: Generate and Apply Migration

```bash
# Generate Drizzle migration for slug columns
bun run drizzle-kit generate

# Apply migration to your database
bun run drizzle-kit migrate
```

### Step 2: Populate Slugs

```bash
# Run the slug population script
bun run populate-slugs.ts
```

**Expected Output:**

-   ✅ Billets: X updated, Y skipped
-   ✅ Positions: X updated, Y skipped, Z left null (non-leadership)
-   ⚠️ Any warnings for unmapped positions

**Review Warnings:**

-   Check any positions that couldn't be automatically mapped
-   Manually update slugs in database if needed
-   Verify hierarchy relationships are correct

### Step 3: Test the System

1. **Login as different users** with various billets/positions
2. **Check trooperCtx** in browser console:

```javascript
// In browser console
console.log(JSON.parse(localStorage.getItem("trooperCtx")));
```

3. **Verify permissions**:
    - Test `ProtectedComponent` with billet slugs
    - Test hierarchy (superior accessing subordinate resources)
    - Test backward compatibility (existing rank/department checks)

### Step 4: Start Using New Permissions

Update your components to use the new slug-based permissions:

```tsx
// Old way (still works!)
<ProtectedComponent allowedPermissions={["Admin", RankLevel.Command]}>

// New way (with slugs!)
<ProtectedComponent allowedPermissions={[
  "Admin",
  RankLevel.Command,
  "cinder-1-1:lead",  // ← NEW!
  "training:lead"     // ← NEW!
]}>
```

## 🎯 Key Design Decisions

### 1. Pre-Expanded Hierarchy

**Why:** Performance. Client-side checks are instant (no API calls).
**How:** Hierarchy expanded server-side on login, cached in trooperCtx.

### 2. Nullable Slugs for Non-Leadership

**Why:** Regular department members inherit scope, don't need specific slugs.
**Example:** Admin department member gets "Admin" scope automatically.

### 3. Slug Format: `unit:role`

**Why:** Human-readable, stable, easy to understand.
**Example:** `cinder-1-1:lead` clearly means "Cinder 1-1 Team Leader".

### 4. Backward Compatible

**Why:** Existing code continues to work without changes.
**Benefit:** Gradual migration, no breaking changes.

### 5. In-Memory Caching

**Why:** Org structure doesn't change often, queries are expensive.
**Trade-off:** Cache cleared on server restart (acceptable).

## 🔄 How Updates Work

### When User Billet/Position Changes:

1. Server updates database via `createBilletAssignment()` or `addDepartmentsToTrooper()`
2. If editing current user, UI calls `revalidateTrooperCtx()`
3. Fresh trooperCtx fetched with updated slugs and hierarchy
4. UI automatically updates with new permissions

### When Org Structure Changes:

1. Update `superiorBilletId` or `superiorPositionId` in database
2. Server cache clears automatically (or on restart)
3. Users get updated hierarchy on next login

## 🧪 Testing Checklist

-   [ ] Migration applied successfully
-   [ ] Slug population completed without errors
-   [ ] User with `cinder-hq:lead` can access `cinder-1-1:lead` protected content
-   [ ] User with `cinder-1-1:lead` CANNOT access `cinder-2:lead` protected content
-   [ ] Existing rank-based permissions still work
-   [ ] Existing department-scope permissions still work
-   [ ] trooperCtx includes `billetPermissions` and `positionPermissions`
-   [ ] Editing user's billet triggers revalidation
-   [ ] Console shows no errors on login
-   [ ] Protected routes redirect properly
-   [ ] Navigation items show/hide correctly

## 📊 Files Summary

### Created (9 files)

-   `populate-slugs.ts`
-   `src/services/permissions.ts`
-   `src/lib/permissions.ts`
-   `src/app/api/v1/permissions/check-billet/route.ts`
-   `src/app/api/v1/permissions/check-position/route.ts`
-   `PERMISSIONS_GUIDE.md`
-   `IMPLEMENTATION_SUMMARY.md`

### Modified (9 files)

-   `src/db/schema.ts`
-   `src/services/billets.ts`
-   `src/services/departments.ts`
-   `src/app/api/auth/trooper/route.ts`
-   `src/contexts/controller.tsx`
-   `src/components/protected-component.tsx`
-   `src/components/protected-route.tsx`
-   `src/components/protected-nav-item.tsx`

## 🎉 Benefits

1. **Granular Control**: Permissions at billet/position level
2. **Hierarchical**: Superiors inherit subordinate permissions
3. **Stable**: Slug-based (survives database changes)
4. **Performant**: Pre-expanded, cached, no runtime API calls
5. **Developer-Friendly**: Clear, readable permission checks
6. **Maintainable**: Easy to understand and modify
7. **Type-Safe**: Full TypeScript support
8. **Backward Compatible**: Existing code works unchanged

## 🚀 Next Steps

1. Apply migration
2. Run population script
3. Test thoroughly
4. Update components to use new permissions
5. Train team on new permission system
6. Enjoy fine-grained access control! 🎊
