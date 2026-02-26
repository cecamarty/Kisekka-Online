# Kisekka Online — MVP Feature Completion Guide

> **Purpose**: This document is a prioritised, self-contained spec for an AI agent to implement overnight.
> Each ticket has full context, file paths, and acceptance criteria so no human input is needed.
>
> **Stack**: Next.js 16 (Turbopack), React 19, Firebase (Auth + Firestore), Cloudflare R2 (images), pnpm monorepo.
> **Run with**: `pnpm dev` from root (uses Turbo). Web app runs at `http://localhost:3000`.
> **Node**: `/Users/nerd/.nvm/versions/node/v22.16.0/bin` — prepend to PATH before any commands.

---

## Project Structure

```
apps/web/                    # Next.js web app
  src/app/                   # App Router pages
    api/upload/route.ts      # R2 image upload API
    create/page.tsx          # Create feed post
    login/page.tsx           # Phone OTP login
    onboarding/page.tsx      # New user onboarding
    profile/page.tsx         # User profile
    post/[id]/page.tsx       # Feed post detail + responses
    marketplace/page.tsx     # Marketplace listings
    marketplace/create/page.tsx  # Create listing
    listing/[id]/page.tsx    # Listing detail
    shop/[id]/page.tsx       # Shop profile
    shop/setup/page.tsx      # Shop setup form
    notifications/page.tsx   # Notification center
    page.tsx                 # Home feed
    layout.tsx               # Root layout
    globals.css              # Design system + all global component styles
  src/contexts/AuthContext.tsx  # Auth provider

packages/firebase/src/
  config.ts                  # Firebase init (singleton)
  auth.ts                    # Phone OTP auth helpers
  collections.ts             # Typed Firestore collection refs
  firestore-service.ts       # All CRUD operations
  storage.ts                 # R2 image upload (via /api/upload)
  index.ts                   # Re-exports

packages/types/src/index.ts  # All TypeScript types + enums
packages/utils/src/
  formatting.ts              # timeAgo, formatPrice, formatPhoneNumber
  whatsapp.ts                # WhatsApp deep link builders
  images.ts                  # Client-side image compression
```

---

## Priority Legend

- 🔴 **P0 — Critical** (app is broken without this)
- 🟠 **P1 — High** (core feature gap, must have for MVP)
- 🟡 **P2 — Medium** (important but not blocking launch)
- 🟢 **P3 — Nice-to-have** (quality-of-life improvements)

---

## 🔴 P0 — CRITICAL FIXES

### T01: Search Page (Missing — Bottom Nav Links to /search Which 404s)

**Problem**: The home page bottom nav has a Search icon linking to `/search`, but no page exists at that route. Users tap it and get a 404.

**Files to create**:
- `apps/web/src/app/search/page.tsx`
- `apps/web/src/app/search/search.module.css`

**Required functionality**:
1. Full-page search with auto-focus text input at the top
2. Search scope: feed posts (partName, carModel, description) + marketplace listings (title, description) + shops (name)
3. Client-side: fetch all active posts + listings on mount, filter as user types (debounce 300ms)
4. Results displayed in 3 sections: "Requests", "For Sale", "Shops" — each with max 5 results and a "See all" button
5. Each result is tappable → navigates to `/post/{id}`, `/listing/{id}`, or `/shop/{id}`
6. Empty state when no query: show "Recent searches" or popular categories as chip buttons
7. Must include bottom navigation matching the home page's icon-only bottom nav

**Services needed** (already exist):
- `getFeedPosts()` from `@kisekka/firebase`
- `getMarketplaceListings()` from `@kisekka/firebase`
- `getShopsByCategory()` or add a `searchShops()` function

**New service to add** in `packages/firebase/src/firestore-service.ts`:
```typescript
export async function getAllShops(pageSize: number = 50): Promise<Shop[]> {
    const q = query(
        collections.shops(),
        where("marketId", "==", DEFAULT_MARKET_ID),
        limit(pageSize)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Shop);
}
```

Also export it from `packages/firebase/src/index.ts`.

**Acceptance criteria**:
- [ ] `/search` loads without 404
- [ ] Typing in the search box filters results in real-time
- [ ] Results link to the correct detail pages
- [ ] Bottom nav matches home page (icon-only, 5 items)

---

### T02: Fix Author Display Name on Feed Posts

**Problem**: Feed posts show "Mechanic" or "You" instead of the actual author's display name. The post stores `authorId` but the home page never fetches the author's user document.

**File to modify**: `apps/web/src/app/page.tsx`

**Current code** (line 151):
```tsx
<div className="post-card__author">{post.authorId === firebaseUser?.uid ? "You" : "Mechanic"}</div>
```

**Required fix**:
1. After fetching posts, batch-fetch all unique `authorId`s using `getUser()` from `@kisekka/firebase`
2. Store an `authorMap: Record<string, User>` in state
3. Display `authorMap[post.authorId]?.displayName || "Unknown User"` instead of "Mechanic"
4. Show "You" only if `post.authorId === firebaseUser?.uid`
5. Show the author's avatar initial in `post-card__avatar` instead of the part name initial

**Acceptance criteria**:
- [ ] Each post shows the author's real display name
- [ ] Author avatar shows the first letter of their name
- [ ] "You" is shown only for the current user's own posts

---

### T03: Fix Post Card Avatar — Show Author Photo if Available

**Problem**: Post card avatars always show a placeholder letter. If the user has an `avatarUrl`, it should be displayed.

**File to modify**: `apps/web/src/app/page.tsx`

**After implementing T02's author map**, update the avatar div:
```tsx
<div className="post-card__avatar">
  {authorMap[post.authorId]?.avatarUrl ? (
    <img src={authorMap[post.authorId].avatarUrl} alt="" />
  ) : (
    authorMap[post.authorId]?.displayName?.[0] || "?"
  )}
</div>
```

---

### T04: Marketplace Create Page Uses Wrong CSS Module Path

**Problem**: `apps/web/src/app/marketplace/create/page.tsx` imports:
```typescript
import styles from "../create/create.module.css";
```
This is a relative path pointing to `marketplace/create/create.module.css` which doesn't exist. It should either:
- Have its own `create.module.css` in that directory, OR
- Import from `../../create/create.module.css` if reusing the feed create styles

**File to modify**: `apps/web/src/app/marketplace/create/page.tsx`

**Fix**: Create `apps/web/src/app/marketplace/create/create.module.css` with styles matching the feed create page's chip-based design (copy from `apps/web/src/app/create/create.module.css` and adjust as needed).

**Also**: The marketplace create page still uses `<select>` dropdowns and the old form structure. Refactor it to match the new chip-based create page design pattern (see `apps/web/src/app/create/page.tsx` for reference).

**Acceptance criteria**:
- [ ] `/marketplace/create` loads without CSS errors
- [ ] Uses chip selectors for category and condition
- [ ] Has the same Instagram-style header with "Share" button

---

## 🟠 P1 — HIGH PRIORITY

### T05: Infinite Scroll / Load More on Feed

**Problem**: Feed currently loads only the first 20 posts and has no way to load more. The PRD requires "vertical infinite scroll."

**File to modify**: `apps/web/src/app/page.tsx`

**Implementation**:
1. Track `lastDoc` (DocumentSnapshot) from the last fetch
2. Add a "Load More" button at the bottom of the feed (or use IntersectionObserver for true infinite scroll)
3. Append new posts to existing posts array
4. Show a spinner while loading more
5. Hide the button when no more posts are returned

**Service change needed** in `packages/firebase/src/firestore-service.ts`:
The `getFeedPosts` function already accepts `lastDoc?: DocumentSnapshot`, but the return type only gives `FeedPost[]` — it doesn't return the raw DocumentSnapshots needed for pagination.

Change the function to also return the last snapshot:
```typescript
export async function getFeedPosts(
    pageSize: number = DEFAULT_PAGE_SIZE,
    lastDoc?: DocumentSnapshot
): Promise<{ posts: FeedPost[]; lastDoc: DocumentSnapshot | null }> {
    // ... existing query code ...
    const snap = await getDocs(q);
    const posts = snap.docs.map((d) => d.data() as FeedPost);
    const lastVisible = snap.docs[snap.docs.length - 1] || null;
    return { posts, lastDoc: lastVisible };
}
```

**NOTE**: This is a **breaking change** — every caller of `getFeedPosts()` must be updated to destructure `{ posts }`.

**Acceptance criteria**:
- [ ] Scrolling to the bottom loads the next page of 20 posts
- [ ] Spinner shown during loading
- [ ] No duplicate posts
- [ ] Works when there are 0, 1-20, and 20+ posts

---

### T06: Pull-to-Refresh on Feed

**Problem**: No way to refresh the feed without manually reloading the browser.

**File to modify**: `apps/web/src/app/page.tsx`

**Implementation**:
1. Add a simple "pull-to-refresh" gesture detector OR a visible refresh button in the header
2. On trigger: clear posts array, reset pagination, re-fetch from the start
3. Show the spinner during refresh

**Simpler alternative** (recommended for MVP): Add a subtle refresh icon button in the header bar that clears and re-fetches.

---

### T07: Real-time Notification Badge Count

**Problem**: The notification bell icon in the header shows a static red dot. It should reflect the actual unread count.

**Files to modify**:
- `apps/web/src/app/page.tsx` (header bell icon)
- `apps/web/src/contexts/AuthContext.tsx` (add unread count to context)

**Implementation**:
1. In `AuthContext`, after fetching the user, also fetch `getUnreadNotificationCount(userId)` and store as `unreadCount` in context
2. Expose `unreadCount` from `useAuth()`
3. In `page.tsx`, conditionally show the badge dot only when `unreadCount > 0`
4. Optionally show the count number if > 0 (like Instagram's badge)

**Service already exists**: `getUnreadNotificationCount()` in `firestore-service.ts`

**Acceptance criteria**:
- [ ] Badge only shows when there are unread notifications
- [ ] Badge disappears after visiting the notifications page
- [ ] Count is fetched on app load and after actions that may create notifications

---

### T08: Edit Profile Page (Currently a Dead Button)

**Problem**: Profile page has an "Edit Profile" menu button that does nothing when tapped.

**Files to create**:
- `apps/web/src/app/profile/edit/page.tsx`
- `apps/web/src/app/profile/edit/edit.module.css`

**Required fields**:
1. Display Name (text input, pre-filled)
2. WhatsApp Number (tel input, pre-filled)
3. Location Zone (chip selector, pre-filled)
4. Avatar (image upload with preview, uses R2 via `/api/upload`)
5. Save button → calls `updateUser()` from `@kisekka/firebase`

**Also modify**: `apps/web/src/app/profile/page.tsx` — wire the "Edit Profile" button to `router.push("/profile/edit")`

**Acceptance criteria**:
- [ ] Tapping "Edit Profile" navigates to the edit page
- [ ] All fields pre-populated with current user data
- [ ] Changes save to Firestore and reflect immediately
- [ ] Avatar upload works through R2

---

### T09: My Posts Page (Currently a Dead Button)

**Problem**: Profile page has a "My Posts" menu button that does nothing.

**Files to create**:
- `apps/web/src/app/profile/posts/page.tsx`
- `apps/web/src/app/profile/posts/posts.module.css`

**Implementation**:
1. Fetch feed posts where `authorId === firebaseUser.uid` (add query to `firestore-service.ts`)
2. Display in the same card format as the home feed
3. Show both active and resolved posts with status badges
4. Allow marking a post as "Resolved" (update status to "resolved" in Firestore)

**New service function** in `firestore-service.ts`:
```typescript
export async function getUserFeedPosts(userId: string): Promise<FeedPost[]> {
    const q = query(
        collections.feedPosts(),
        where("authorId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(50)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as FeedPost);
}
```

Export from `index.ts`.

**Also modify**: `apps/web/src/app/profile/page.tsx` — wire the "My Posts" button to `router.push("/profile/posts")`

**Acceptance criteria**:
- [ ] Shows all of the current user's posts
- [ ] Each post shows its status (active, resolved, expired)
- [ ] User can mark a post as resolved
- [ ] Tapping a post navigates to the detail page

---

### T10: Consistent Bottom Navigation Across All Pages

**Problem**: The bottom navigation component is copy-pasted in every page with inconsistencies:
- Home (`page.tsx`): icon-only, 5 items (Home, Search, Create, Market, Profile)
- Marketplace: has text labels ("Home", "Market", "Alerts", "Profile"), 4 items, missing Search + Create
- Profile: has text labels, 4 items
- Notifications: has text labels, 4 items
- All other pages: no bottom nav

**Fix approach**: Create a shared `BottomNav` component.

**Files to create**:
- `apps/web/src/components/BottomNav.tsx`

**Component spec**:
```tsx
interface BottomNavProps {
  active: "home" | "search" | "create" | "market" | "profile";
}
```

Use the same 5 icon-only items as the home page. Import and use in every page that should have bottom nav:
- `/` (home) — active: home
- `/search` — active: search
- `/marketplace` — active: market
- `/profile` — active: profile
- `/notifications` — active: none (but still show nav)

**Files to modify**: `page.tsx`, `marketplace/page.tsx`, `profile/page.tsx`, `notifications/page.tsx`, and the new `search/page.tsx`.

Remove the inline bottom nav from each of these pages and replace with `<BottomNav active="..." />`.

**Acceptance criteria**:
- [ ] Bottom nav appears on all main pages
- [ ] All 5 icons are present and consistent
- [ ] Active state is correctly highlighted
- [ ] No text labels — icons only
- [ ] Create button routes through the auth check (login → onboarding → create)

---

### T11: "Social Sale" Post Type (Create Page Only Supports "Request")

**Problem**: The PRD says PostType can be `"request"` or `"social_sale"`, but the create page only creates requests. Users should be able to choose between "Looking for a part" and "Selling a part".

**File to modify**: `apps/web/src/app/create/page.tsx`

**Implementation**:
1. Add a post type toggle at the top of the form: "🔍 Looking for" / "🏷️ Selling"
2. When "Selling" is selected, show additional fields: Price (number input, UGX), Condition (chips: New/Used/Refurbished)
3. Set `type: "social_sale"` on the post when selling
4. Existing fields (part name, car model, year, description, photos, category, zone) stay the same

**Type addition** in `packages/types/src/index.ts` — `FeedPost` already has optional fields for price but they're not in the interface. Add:
```typescript
export interface FeedPost {
    // ... existing fields ...
    price?: number;
    condition?: ListingCondition;
}
```

Update `CreateFeedPostInput` accordingly.

**Acceptance criteria**:
- [ ] User can toggle between "Looking for" and "Selling"
- [ ] Selling mode shows Price and Condition fields
- [ ] Posts are created with the correct `type`
- [ ] Feed distinguishes between requests and sales posts visually

---

## 🟡 P2 — MEDIUM PRIORITY

### T12: Firestore Security Rules

**Problem**: No security rules are deployed. Any unauthenticated user can read/write any collection.

**File to create**: `firestore.rules` (project root)

**Key rules**:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users
    match /users/{userId} {
      allow read: if true;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && request.auth.uid == userId;
    }

    // Shops
    match /shops/{shopId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update: if request.auth != null
        && request.auth.uid == resource.data.ownerId;
    }

    // Feed Posts
    match /feedPosts/{postId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
    }

    // Marketplace Listings
    match /marketplaceListings/{listingId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update: if request.auth != null
        && request.auth.uid == resource.data.sellerId;
    }

    // Responses
    match /responses/{responseId} {
      allow read: if true;
      allow create: if request.auth != null;
    }

    // Notifications
    match /notifications/{notificationId} {
      allow read: if request.auth != null
        && request.auth.uid == resource.data.userId;
      allow update: if request.auth != null
        && request.auth.uid == resource.data.userId;
    }

    // Reports
    match /reports/{reportId} {
      allow create: if request.auth != null;
    }

    // Activity Signals
    match /activitySignals/{docId} {
      allow create: if true;
    }
  }
}
```

Also create `firestore.indexes.json` with composite indexes for:
- `feedPosts`: `(marketId, status, urgent DESC, lastActivityAt DESC)`
- `feedPosts`: `(marketId, category, status, lastActivityAt DESC)`
- `feedPosts`: `(authorId, createdAt DESC)`
- `marketplaceListings`: `(marketId, status, createdAt DESC)`
- `marketplaceListings`: `(marketId, status, category, createdAt DESC)`
- `notifications`: `(userId, createdAt DESC)`
- `notifications`: `(userId, read)`
- `responses`: `(postId, createdAt ASC)`

**Acceptance criteria**:
- [ ] Rules file exists and is syntactically valid
- [ ] Index file covers all queries in `firestore-service.ts`

---

### T13: Report Button on Posts and Responses

**Problem**: PRD requires "Report button on posts and responses" but none is implemented in the UI.

**Files to modify**:
- `apps/web/src/app/post/[id]/page.tsx` — add report button on the post
- `apps/web/src/app/listing/[id]/page.tsx` — add report button on the listing

**Implementation**:
1. Add a "⋯" (three dots) overflow menu button on each post card header and response
2. Menu shows: "Report" option
3. Tapping Report opens a simple modal/sheet with reason selection (use `ReportReason` type: spam, inappropriate, fake, scam, other)
4. Submit calls `createReport()` from `@kisekka/firebase` (already exists)
5. Show a toast/banner: "Thank you for reporting. We'll review shortly."

**Acceptance criteria**:
- [ ] Report button visible on posts and responses
- [ ] Report reason selection works
- [ ] Report is saved to Firestore

---

### T14: R2 Upload API Route — Auth Protection

**Problem**: The `/api/upload` route has no authentication check. Anyone can upload files.

**File to modify**: `apps/web/src/app/api/upload/route.ts`

**Implementation**:
1. Verify the Firebase auth token from the request headers
2. Use `firebase-admin` SDK to verify the token server-side, OR
3. Simpler: pass the Firebase user's ID token in the upload request and verify it

**Recommended simple approach**: Accept a `token` field in the FormData, then verify it using the Firebase Admin SDK.

**New dependency** (add to `apps/web/package.json`): `firebase-admin`

**Acceptance criteria**:
- [ ] Unauthenticated uploads return 401
- [ ] Authenticated uploads work as before
- [ ] No Firebase Admin private key is exposed to the client

---

### T15: Delete/Edit Post (Post Author Should Be Able to Manage Their Posts)

**Problem**: Once a post is created, the author cannot edit or delete it. This is needed for V1.

**Files to modify**:
- `apps/web/src/app/post/[id]/page.tsx`
- `packages/firebase/src/firestore-service.ts`

**New service functions**:
```typescript
export async function updateFeedPost(postId: string, data: Partial<FeedPost>): Promise<void> {
    await updateDoc(docs.feedPost(postId), {
        ...data,
        lastActivityAt: serverTimestamp(),
    });
}

export async function deleteFeedPost(postId: string): Promise<void> {
    await deleteDoc(docs.feedPost(postId));
}
```

Export both from `index.ts`.

**UI**: On the post detail page, if `post.authorId === firebaseUser?.uid`, show a "⋯" menu with "Edit" and "Delete" options.

---

### T16: Marketplace Create Page — Use R2 for Image Upload

**Problem**: `apps/web/src/app/marketplace/create/page.tsx` imports `uploadImage` and `compressImage` but may still reference the old `OffscreenCanvas` compression logic if the import path is wrong.

**Verify**: Ensure this page imports `compressImage` from `@kisekka/utils` (which now uses regular canvas) and `uploadImage` from `@kisekka/firebase` (which now uses R2).

---

## 🟢 P3 — NICE-TO-HAVE

### T17: Toast/Snackbar Component for User Feedback

**Problem**: There's no toast/snackbar system. Success and error messages are either inline or missing entirely (e.g., after reporting, after creating a post successfully).

**Files to create**:
- `apps/web/src/components/Toast.tsx`
- Add global toast styles to `globals.css`

**Spec**: Simple animated toast that appears at the bottom of the screen for 3 seconds. Props: `message: string`, `type: "success" | "error" | "info"`.

---

### T18: Skeleton Loaders Instead of Spinners

**Problem**: Every loading state shows a plain spinner. Modern apps use skeleton loaders for a better perceived performance.

**Implementation**: Create `PostCardSkeleton` and `ListingCardSkeleton` components. Use CSS `@keyframes shimmer` for animation. Replace spinner loading states on the home feed and marketplace pages.

---

### T19: Shop Update Function (shop/setup Reassigns on Every Save)

**Problem**: `apps/web/src/app/shop/setup/page.tsx` always calls `createShop()` even when updating an existing shop. This creates a new shop document every time.

**Fix**: Add `updateShop()` to `firestore-service.ts`:
```typescript
export async function updateShop(shopId: string, data: Partial<Shop>): Promise<void> {
    await updateDoc(docs.shop(shopId), {
        ...data,
        lastActivityAt: serverTimestamp(),
    });
}
```

Then in `shop/setup/page.tsx`, check if `user.shopId` exists and call `updateShop()` instead of `createShop()`.

---

### T20: PWA Configuration (Manifest + Service Worker)

**Problem**: The PRD mentions "PWA-friendly" but there's no `manifest.json` or service worker.

**Files to create**:
- `apps/web/public/manifest.json`
- `apps/web/public/icons/` (app icons at 192x192 and 512x512)

**Manifest spec**:
```json
{
  "name": "Kisekka Online",
  "short_name": "Kisekka",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#FFFFFF",
  "theme_color": "#FFFFFF",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

Add manifest link in `layout.tsx`.

---

## Implementation Order (Recommended)

```
Night 1 (Agent):
  1. T01 — Search page (high impact, unblocks bottom nav)
  2. T10 — Shared BottomNav component (fixes inconsistency everywhere)
  3. T02 + T03 — Author names + avatars on feed
  4. T04 — Marketplace create page CSS fix
  5. T05 — Infinite scroll
  6. T09 — My Posts page
  7. T08 — Edit Profile page
  8. T07 — Notification badge
  9. T12 — Firestore rules + indexes

Morning (You test + polish):
  10. T11 — Social sale post type
  11. T06 — Pull-to-refresh
  12. T13 — Report button
  13. T14 — Upload auth protection
  14. T15 — Delete/edit post
  15. T16 — Verify marketplace create imports
  16. T19 — Shop update fix

Later (After launch):
  17-20: Toasts, skeletons, PWA
```

---

## Environment Setup for Agent

```bash
# Set PATH
export PATH="/Users/nerd/.nvm/versions/node/v22.16.0/bin:$PATH"

# Install deps
cd /Users/nerd/dev/Projects/Kisekka-Online && pnpm install

# Run dev server
pnpm dev

# Test in browser
open http://localhost:3000
```

## Key Design Rules

1. **Primary color**: Orange `#FF6600` — used sparingly for CTAs and accents only
2. **Neutral shell**: White/grey backgrounds, black text, no colored backgrounds
3. **Bottom nav**: 5 items, **icon-only** (no text labels), 26px SVG icons
4. **Header**: 48px height, Pacifico font centered logo on home page only
5. **Inner pages**: Use back arrow + centred title header pattern
6. **Form inputs**: Use chip selectors instead of `<select>` dropdowns where possible
7. **Font**: Inter (body), Pacifico (logo only)
8. **Image uploads**: Go through `/api/upload` which uploads to Cloudflare R2
9. **Image compression**: Uses regular canvas (NOT OffscreenCanvas) for iOS compatibility
10. **Buttons**: Use `btn--primary` class for main CTAs, never custom inline orange styles
