# Standards Audit — umak-link-web (Pass 2)

Reference: `/home/charles/Documents/Standards/next-standards.md`
Scope: All files under `src/`

---

## Progress Update — 2026-05-07

Status summary:

### Standards Audit

| Section | Status | Notes |
|---|---|---|
| §1 File Naming | Completed | `src/stores/usePortalStore.ts` was deleted as dead code. |
| §2 TypeScript — `type` vs `interface` | Completed | `notifications.ts` was fixed; shared staff/admin route object-shape `type` aliases were converted to `interface`; `CompactPost`, `ToastTone`, and `LinkedPostRecord` were moved out of component files. |
| §3 Server Data Stored in Zustand | Completed | Staff server-state stores were replaced with TanStack Query hooks. |
| §4 Whole-Store Subscription Without `useShallow` | N/A after refactor | The affected Zustand stores and subscriptions were removed. |
| §5 `useEffect` for Data Fetching | Completed | The cited staff list/detail/search/claim/create-post fetching patterns now rely on TanStack Query hooks or `useCurrentUser`, not raw component-level fetching effects. |
| §6 Type Imported from Component File | Completed | `CompactPost` now lives in `src/types/compact-post.ts`. |
| §7 Dead Code | Completed | `usePortalStore.ts` and `staff-top-nav.tsx` were deleted. |
| §8 Component Size — Over 300-Line Limit | Completed | All current `src/components/staff/*.tsx` files are now under 300 lines after extracting sections, modals, and controller logic. |
| §9 Multiple `useState` Calls — Should Use `useReducer` | Completed | The flagged `create-post`, `staff-claim-post`, `post-record-detail`, and `fraud-report-detail` components now use reducers for related state. |
| §10 Function Defined Inside Component Body | Completed | The `getFiltersFromUrl` helper in `post-records-view.tsx` was removed. |
| §11 Duplicate Helper Functions Across Files | Completed | Shared formatting helpers and `Overlay` were extracted. |
| §12 Unnecessary `useMemo` | Completed | Trivial profile `useMemo`s and the detail-view normalization `useMemo`s were removed. |
| §13 Accessibility — Missing Labels | Completed | The flagged inputs/selects now have labels. |
| §14 Accessibility — `<button>` Without `type` | Completed | Dead file removed; `compact-post-card.tsx` share button now has `type="button"`. |
| §15 Duplicate Components | Completed | Admin/staff profile pages now use a shared `ProfileView`. |

### Pass 3 — Experiences Audit

| Item | Status | Notes |
|---|---|---|
| P3-1 Shared Mutation Pending State Across a List | Completed | Dashboard card actions now disable only the card currently being processed. |
| P3-2 No Sensitive Data in Logs | Completed | Raw `console.error(error)` calls under `src/` were replaced with safe string logging via `src/lib/error-utils.ts`. |
| P3-3 Raw API Exception Messages Exposed to Client | Completed | Staff claim submission now logs safely and always shows a generic failure toast. |
| P3-4 Auth Hydration Flash | Completed | Staff create-post uses `useCurrentUser()` loading state so the initial idle-to-loading transition no longer flashes the form. |

Notes:

- This update supersedes the 2026-05-06 summary below.
- The 2026-05-06 report is preserved for history.

---

## Progress Update — 2026-05-06

Status summary for the Standards Audit section only:

| Section | Status | Notes |
|---|---|---|
| §1 File Naming | Completed | `src/stores/usePortalStore.ts` was deleted as dead code. |
| §2 TypeScript — `type` vs `interface` | Completed | `notifications.ts` was fixed; shared staff/admin route object-shape `type` aliases were converted to `interface`; `CompactPost`, `ToastTone`, and `LinkedPostRecord` were moved out of component files. |
| §3 Server Data Stored in Zustand | Completed | Staff server-state stores were replaced with TanStack Query hooks. |
| §4 Whole-Store Subscription Without `useShallow` | N/A after refactor | The affected Zustand stores and subscriptions were removed. |
| §5 `useEffect` for Data Fetching | Mostly Completed | Query-based replacements landed for dashboard, fraud reports, post records, search, detail views, claim lookup, and auth hydration in create-post. |
| §6 Type Imported from Component File | Completed | `CompactPost` now lives in `src/types/compact-post.ts`. |
| §7 Dead Code | Completed | `usePortalStore.ts` and `staff-top-nav.tsx` were deleted. |
| §8 Component Size — Over 300-Line Limit | Completed | All current `src/components/staff/*.tsx` files are now under 300 lines after extracting sections, modals, and controller logic. |
| §9 Multiple `useState` Calls — Should Use `useReducer` | Completed | The flagged `create-post`, `staff-claim-post`, `post-record-detail`, and `fraud-report-detail` components now use reducers for related state. |
| §10 Function Defined Inside Component Body | Completed | The `getFiltersFromUrl` helper in `post-records-view.tsx` was removed. |
| §11 Duplicate Helper Functions Across Files | Completed | Shared formatting helpers and `Overlay` were extracted. |
| §12 Unnecessary `useMemo` | Completed | Trivial profile `useMemo`s and the detail-view normalization `useMemo`s were removed. |
| §13 Accessibility — Missing Labels | Completed | The flagged inputs/selects now have labels. |
| §14 Accessibility — `<button>` Without `type` | Completed | Dead file removed; `compact-post-card.tsx` share button now has `type="button"`. |
| §15 Duplicate Components | Completed | Admin/staff profile pages now use a shared `ProfileView`. |

Notes:

- The original findings below are preserved for traceability.
- “Completed” means the specific first-pass issue is no longer present in the current codebase.
- “In Progress” means the issue was reduced but not fully resolved to the standard described here.

---

## 1. File Naming

Current status: Completed. `src/stores/usePortalStore.ts` no longer exists.

**Rule:** Stores must be named `domain-store.ts` (kebab-case).

### `src/stores/usePortalStore.ts`

Wrong: file name uses camelCase.

```
src/stores/usePortalStore.ts   ← rename to portal-store.ts
```

Also note: this file has zero importers anywhere in `src/` — it is dead code and should be deleted entirely (see §9).

---

## 2. TypeScript — `type` vs `interface`

Current status: Completed. `src/types/notifications.ts` was fixed, the local `CompactPost`, `ToastTone`, and `LinkedPostRecord` definitions were moved to shared modules, and the remaining audited object-shape `type` aliases were converted to `interface`.

**Rule:** Use `interface` for object shapes. `type` is for unions, intersections, and mapped types only.

### `src/stores/usePortalStore.ts:5-8`

```typescript
// Bad — object shape using type
type PortalStore = {
  activeRole: PortalRole;
  setActiveRole: (role: PortalRole) => void;
};

// Fix
interface PortalStore {
  activeRole: PortalRole;
  setActiveRole: (role: PortalRole) => void;
}
```

`type PortalRole = "admin" | "staff"` is correct — leave it.

### `src/types/notifications.ts:23`

```typescript
// Bad — any is banned under strict mode
data?: any;

// Fix
data?: Record<string, unknown>;
```

### `src/components/staff/compact-post-card.tsx:10-38`

The `CompactPost` interface is defined inside a component file. Types belong in `src/types/`, not inside components or stores.

```
Move CompactPost interface → src/types/post.ts (or src/types/compact-post.ts)
Then import from there in compact-post-card.tsx and staff-dashboard-store.ts
```

### `src/components/staff/post-record-detail-view.tsx:22-23`

```typescript
// Bad — local type definitions in a component file
type ToastTone = "success" | "danger";
type LinkedPostRecord = ApiPostRecord | ApiPostRecordDetails;
```

`ToastTone` is a union (so `type` is correct) and `LinkedPostRecord` is a union (so `type` is also correct), but both should live in `src/types/`, not inline in a component.

```
Move ToastTone → src/types/ui.ts (or reuse if already defined elsewhere)
Move LinkedPostRecord → src/types/post-record-api.ts
```

Same pattern in `src/components/staff/fraud-report-detail-view.tsx:22` — `type ToastTone` defined again locally. Centralize in `types/` and import in both files.

---

## 3. Server Data Stored in Zustand

Current status: Completed. The staff dashboard, post records, fraud reports, and search flows now use TanStack Query hooks under `src/hooks/queries/`, and the old staff server-state stores were deleted.

**Rule:** Server data (posts list, search results, fraud reports) belongs in TanStack Query. Zustand is for client-owned state that multiple components share.

All four domain stores fetch paginated server data and hold it in Zustand state. This means no caching, no deduplication, no background refetching, and manual loading/error state management duplicated four times.

| Store | Server data held | Fix |
|---|---|---|
| `staff-dashboard-store.ts` | `posts[]`, stats | Replace with `useInfiniteQuery` + `useQuery` |
| `staff-post-records-store.ts` | `records[]` | Replace with `useInfiniteQuery` |
| `staff-fraud-reports-store.ts` | `reports[]` | Replace with `useInfiniteQuery` |
| `staff-search-store.ts` | `results[]`, `matchedPostIds[]` | Replace with `useQuery` keyed on search params |

**Fix pattern** (same for all four):

```typescript
// Bad — current pattern in stores
fetchRecords: async (params) => {
  set({ isLoading: true });
  const response = await listPosts({ ... });
  set({ records: response.posts.map(mapPostToRecord), isLoading: false });
},

// Fix — move to a custom hook using TanStack Query
export function usePostRecords(params: StaffPostRecordsParams) {
  return useInfiniteQuery({
    queryKey: postRecordKeys.list(params),
    queryFn: ({ pageParam = 0 }) =>
      listPosts({ ...params, offset: pageParam, limit: PAGE_SIZE }).then(
        (r) => r.posts.map(mapPostToRecord)
      ),
    getNextPageParam: (lastPage, pages) =>
      lastPage.length === PAGE_SIZE ? pages.length * PAGE_SIZE : undefined,
  });
}
```

Filter/sort state (`params`, `sortDir`) is UI state — keep that in component `useState` or in the URL (as already done in `post-records-view.tsx`).

---

## 4. Zustand — Whole-Store Subscription Without `useShallow`

Current status: N/A after refactor. The affected whole-store subscriptions were removed along with the corresponding staff server-state stores.

**Rule:** When selecting multiple fields, use `useShallow`. Never subscribe to the entire store.

### `src/components/staff/staff-dashboard-view.tsx:26-38`

```typescript
// Bad — subscribes to entire store, re-renders on every state change
const { posts, isLoading, ... } = useStaffDashboardStore();

// Fix
import { useShallow } from 'zustand/react/shallow';

const { posts, isLoading, isRefreshing, error, hasMore, fetchPosts, loadMore, refresh, stats, fetchStats, removePost } =
  useStaffDashboardStore(
    useShallow((s) => ({
      posts: s.posts,
      isLoading: s.isLoading,
      isRefreshing: s.isRefreshing,
      error: s.error,
      hasMore: s.hasMore,
      fetchPosts: s.fetchPosts,
      loadMore: s.loadMore,
      refresh: s.refresh,
      stats: s.stats,
      fetchStats: s.fetchStats,
      removePost: s.removePost,
    }))
  );
```

### `src/components/staff/fraud-reports-view.tsx:39-51`

Same pattern — `useStaffFraudReportsStore()` with no selector. Apply `useShallow` identically.

### `src/components/staff/post-records-view.tsx:63-64`

Same pattern — `useStaffPostRecordsStore()` with no selector. Apply `useShallow` identically.

`staff-search-view.tsx` already uses `useShallow` correctly — that is the pattern to follow.

---

## 5. `useEffect` for Data Fetching

Current status: Completed. The cited staff list/detail/search/claim/create-post fetching patterns now use Query hooks or `useCurrentUser()` rather than raw component-level fetching effects. The wording below is preserved from the original audit snapshot for traceability.

**Rule:** Use TanStack Query for all server data. Never use raw `fetch()` inside `useEffect`.

### `src/components/staff/staff-dashboard-view.tsx:92-102`

```typescript
// Bad — triggers server fetch inside useEffect
useEffect(() => {
  fetchPosts({ ... });
}, [fetchPosts, itemTypeForFetch]);

useEffect(() => {
  fetchStats();
}, [fetchStats]);

// Fix — once stores are replaced with TanStack Query hooks,
// the query runs automatically on mount and when queryKey changes.
// No useEffect needed.
const { data, fetchNextPage, hasNextPage } = usePostRecords({ itemType: itemTypeForFetch, postStatus: 'pending' });
const { data: stats } = useDashboardStats();
```

### `src/components/staff/fraud-reports-view.tsx:74-76`

```typescript
// Bad
useEffect(() => {
  fetchReports({ sortDirection: sortDir, pageSize: 10 });
}, [fetchReports, sortDir]);

// Fix — same as above, replace store with useInfiniteQuery keyed on sortDir
```

### `src/components/staff/post-records-view.tsx:112-120`

```typescript
// Bad
useEffect(() => {
  fetchRecords({ ... });
}, [fetchRecords, filters.itemType, filters.postStatus, filters.itemStatus, sortDir]);

// Fix — replace store with useInfiniteQuery keyed on filters + sortDir
```

### `src/components/staff/post-record-detail-view.tsx:195-197`

```typescript
// Bad
useEffect(() => {
  void loadPost();
}, [loadPost]);

// Fix
const { data: record, isLoading } = useQuery({
  queryKey: postKeys.detail(postId),
  queryFn: () => getPostFull(postId),
});
// Derived linkedPost can be fetched with a dependent query:
const { data: linkedPost } = useQuery({
  queryKey: postKeys.linked(record?.item_id),
  queryFn: () => fetchLinkedPost(record!),
  enabled: Boolean(record),
});
```

### `src/components/staff/fraud-report-detail-view.tsx:106-108`

```typescript
// Bad
useEffect(() => {
  void fetchReport();
}, [fetchReport]);

// Fix
const { data: report, isLoading } = useQuery({
  queryKey: fraudReportKeys.detail(reportId),
  queryFn: () => getFraudReport(reportId),
});
```

### `src/components/staff/staff-claim-post-view.tsx:136-203`

Three separate `useEffect` blocks all performing raw `api.get()` calls:

```typescript
// Bad — raw api.get() inside useEffect for post load
useEffect(() => { void loadPost(); }, [loadPost]);

// Bad — debounced api.get() for user search
useEffect(() => {
  const timer = setTimeout(async () => {
    const { data } = await api.get('/users/search', { params: { query: searchQuery } });
    ...
  }, 300);
  return () => clearTimeout(timer);
}, [searchQuery]);

// Bad — debounced api.get() for lost item lookup
useEffect(() => {
  const timer = setTimeout(async () => {
    const { data } = await api.get('/posts/public', { params: { item_id: formData.lostItemId } });
    ...
  }, 500);
  return () => clearTimeout(timer);
}, [formData.lostItemId]);
```

```typescript
// Fix — use TanStack Query for all three
const { data: post, isLoading } = useQuery({
  queryKey: postKeys.full(postId),
  queryFn: () => getPostFull(postId),
});

const { data: userResults } = useQuery({
  queryKey: userKeys.search(debouncedSearchQuery),
  queryFn: () => searchUsers(debouncedSearchQuery),
  enabled: debouncedSearchQuery.length >= 2,
});

const { data: lostItemPost } = useQuery({
  queryKey: postKeys.byItemId(debouncedLostItemId),
  queryFn: () => fetchLostItem(debouncedLostItemId),
  enabled: Boolean(debouncedLostItemId.trim()),
});
// Debouncing is done with a useDebouncedValue hook, not setTimeout in useEffect
```

### `src/components/staff/create-post-view.tsx:136-138`

```typescript
// Bad — duplicates the same hydrateUser() call already in use-current-user.ts
useEffect(() => {
  void hydrateUser();
}, [hydrateUser]);

// Fix — replace both useState lines for user/authStatus with useCurrentUser hook
const { user, status: authStatus } = useCurrentUser();
// Remove the three separate useAuthStore selector calls and the useEffect
```

### `src/components/staff/staff-sidebar.tsx:48-69`

```typescript
// Bad — polling with setInterval inside useEffect, raw service call, console.error
useEffect(() => {
  if (!user) return;
  const loadCount = async () => {
    try {
      setCountLoading(true);
      const data = await fetchUnreadNotificationsCount();
      setUnreadCount(data.unread_count);
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    } finally {
      setCountLoading(false);
    }
  };
  loadCount();
  const interval = setInterval(loadCount, 30000);
  return () => clearInterval(interval);
}, [user]);

// Fix — TanStack Query handles polling natively
const { data: unreadData } = useQuery({
  queryKey: notificationKeys.unreadCount(),
  queryFn: fetchUnreadNotificationsCount,
  refetchInterval: 30_000,
  enabled: Boolean(user),
});
const unreadCount = unreadData?.unread_count ?? 0;
```

---

## 6. Type Imported from Component File

Current status: Completed. `CompactPost` now lives in `src/types/compact-post.ts`.

**Rule:** Types belong in `src/types/`. Do not import types from component files into stores or other components.

### `src/stores/staff-dashboard-store.ts:5`

```typescript
// Bad — type imported from a component file
import type { CompactPost } from "@/components/staff/compact-post-card";

// Fix — move CompactPost to src/types/ and import from there
import type { CompactPost } from "@/types/compact-post";
```

---

## 7. Dead Code

Current status: Completed. Both flagged files were removed.

**Rule:** Remove unused files and exports.

| File | Reason |
|---|---|
| `src/stores/usePortalStore.ts` | Zero importers in `src/`. The store is never consumed. Delete. |
| `src/components/staff/staff-top-nav.tsx` | Zero importers in `src/`. Contains hardcoded dummy data ("Robert Dorwart", notification count "4"). Delete. |

---

## 8. Component Size — Over 300-Line Limit

Current status: Completed. All current `src/components/staff/*.tsx` files are under the 300-line target in the current codebase.

Current line counts:

| File | Current lines |
|---|---:|
| `src/components/staff/post-record-detail-view.tsx` | 292 |
| `src/components/staff/staff-claim-post-view.tsx` | 236 |
| `src/components/staff/create-post-view.tsx` | 132 |
| `src/components/staff/fraud-report-detail-view.tsx` | 201 |
| `src/components/staff/staff-search-view.tsx` | 270 |

**Rule:** Keep components under 300 lines. 500+ must be broken up.

Implemented extractions:

| File | Result |
|---|---|
| `src/components/staff/post-record-detail-view.tsx` | Split into `post-record-detail-view-sections.tsx` and `post-record-detail-view-modals.tsx` |
| `src/components/staff/staff-claim-post-view.tsx` | Split into `staff-claim-post-view-sections.tsx` |
| `src/components/staff/create-post-view.tsx` | Split into `create-post-view-sections.tsx`, `create-post-view-modals.tsx`, and `use-create-post-controller.ts` |
| `src/components/staff/fraud-report-detail-view.tsx` | Split into `fraud-report-detail-view-sections.tsx` |
| `src/components/staff/staff-search-view.tsx` | Split into `staff-search-view-sections.tsx` |
| `src/components/staff/staff-dashboard-view.tsx` | Split into `staff-dashboard-view-sections.tsx` |
| `src/components/staff/post-records-view.tsx` | Split into `post-records-view-sections.tsx` |
| `src/components/staff/fraud-reports-view.tsx` | Split into `fraud-reports-view-sections.tsx` |

---

## 9. Multiple `useState` Calls — Should Use `useReducer`

Current status: Completed. The flagged components now use reducers for related form/UI/modal state.

**Rule:** If a component has 5+ `useState` calls with related state, consolidate with `useReducer`.

### `src/components/staff/create-post-view.tsx` — 14 `useState` calls

All form fields + modals + AI state are related. Group into two reducers:

```typescript
// Fix — form state
const [form, dispatchForm] = useReducer(formReducer, {
  title: '', description: '', date: initialDateTime.date,
  time: initialDateTime.time, meridian: initialDateTime.meridian,
  image: null, category: '', locationDetails: { level1: '', level2: '', level3: '' },
});

// Fix — UI/modal state
const [ui, dispatchUi] = useReducer(uiReducer, {
  isSubmitting: false, isAiGenerating: false, aiGeneratedContent: null,
  showAiConfirm: false, showSubmitConfirm: false, showDiscardConfirm: false, toast: null,
});
```

### `src/components/staff/staff-claim-post-view.tsx` — 14 `useState` calls

```typescript
// Fix — form state
const [form, dispatchForm] = useReducer(claimFormReducer, {
  contactNumber: '', lostItemId: '', claimedAt: new Date().toISOString().slice(0, 16),
});

// Fix — search + modal UI state
const [ui, dispatchUi] = useReducer(claimUiReducer, {
  searchQuery: '', searchResults: [], isSearching: false,
  selectedUser: null, showManualInput: false,
  manualName: '', manualEmail: '',
  showConfirmModal: false, showCancelModal: false, toast: null,
});
```

### `src/components/staff/post-record-detail-view.tsx` — 10 `useState` calls

```typescript
// Fix — modal + selection state
const [ui, dispatch] = useReducer(detailUiReducer, {
  showStatusModal: false, showRejectModal: false,
  showUnclaimModal: false, showNotifyModal: false,
  selectedStatus: null, selectedItemStatus: null, toast: null,
});
```

### `src/components/staff/fraud-report-detail-view.tsx` — 7 `useState` calls

```typescript
// Fix
const [ui, dispatch] = useReducer(fraudDetailUiReducer, {
  showAcceptModal: false, showRejectModal: false,
  showCloseChoiceModal: false, toast: null,
});
```

---

## 10. Function Defined Inside Component Body

Current status: Completed. The named `getFiltersFromUrl` helper in `post-records-view.tsx` was removed and replaced by direct derived values.

**Rule:** Stable logic should not be redefined on every render. Extract to module scope or `useCallback`.

### `src/components/staff/post-records-view.tsx:66-76`

```typescript
// Bad — recreated every render
const getFiltersFromUrl = (): PostRecordFilters => {
  const postStatus = searchParams.get("postStatus") as ...;
  ...
};
const filters = getFiltersFromUrl();

// Fix — derive inline without a named function, or memoize
const filters: PostRecordFilters = {
  postStatus: (searchParams.get("postStatus") as PostRecordFilters["postStatus"]) ?? "all",
  itemStatus: (searchParams.get("itemStatus") as PostRecordFilters["itemStatus"]) ?? "all",
  itemType:   (searchParams.get("itemType")   as PostRecordFilters["itemType"])   ?? "all",
};
```

---

## 11. Duplicate Helper Functions Across Files

Current status: Completed. Shared formatting helpers now live in `src/lib/format-utils.ts`, and the shared modal overlay lives in `src/components/ui/overlay.tsx`.

`post-record-detail-view.tsx` and `fraud-report-detail-view.tsx` both independently define `normalizeValue`, `toDisplayLabel`, and `Overlay`. Any change must be made twice.

```typescript
// Bad — normalizeValue defined in post-record-detail-view.tsx:45-47
function normalizeValue(value: string | null | undefined): string {
  return (value ?? "").toLowerCase();
}

// Also defined identically in fraud-report-detail-view.tsx:32-34
function normalizeValue(value: string | null | undefined): string {
  return (value ?? "").toLowerCase();
}

// Fix — extract to src/lib/format-utils.ts (or equivalent)
// and import in both files
export function normalizeValue(value: string | null | undefined): string {
  return (value ?? "").toLowerCase();
}

export function toDisplayLabel(value: string | null | undefined, fallback = "Unknown"): string { ... }

// Overlay is an internal component — both files define it identically.
// Fix — extract to src/components/ui/overlay.tsx
export function Overlay({ children }: { children: ReactNode }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">{children}</div>;
}
```

---

## 12. Unnecessary `useMemo` for Trivial Derived Values

Current status: Completed for the cited findings. The trivial profile `useMemo` usages were removed, and the normalization `useMemo`s in `post-record-detail-view.tsx` were also removed.

**Rule:** Compute inline during render. `useMemo` is for expensive computations, not simple string operations.

### `src/components/admin/admin-profile-view.tsx:21`
### `src/components/staff/staff-profile-view.tsx:21`

```typescript
// Bad — useMemo wrapping a trim + fallback is O(1) and not worth memoizing
const profileName = useMemo(() => user?.user_name?.trim() || "Admin User", [user?.user_name]);

// Fix — compute inline
const profileName = user?.user_name?.trim() || "Admin User";
```

### `src/components/staff/post-record-detail-view.tsx:128-135`

```typescript
// Bad — useMemo on a toLowerCase() call
const normalizedPostStatus = useMemo(
  () => normalizeValue(record?.post_status) as ApiPostStatus,
  [record?.post_status]
);

// Fix — compute inline
const normalizedPostStatus = normalizeValue(record?.post_status) as ApiPostStatus;
const normalizedItemStatus = normalizeValue(record?.item_status) as ApiItemStatus;
```

---

## 13. Accessibility — Inputs and Selects Without Associated Labels

Current status: Completed for the cited controls.

**Rule:** Every form input must have an associated label via `htmlFor` or wrapping. Placeholder text is not a label.

| File | Line(s) | Issue | Fix |
|---|---|---|---|
| `fraud-reports-view.tsx` | 195–205 | `<select>` sort has no `<label>` | Add `<label htmlFor="fraud-sort">Sort</label>` and `id="fraud-sort"` on the select |
| `post-records-view.tsx` | 299–309 | `<select>` sort has no `<label>` | Same pattern |
| `staff-search-view.tsx` | 397–427 | Category, location, and date `<input>` elements have no `<label>`, only placeholder text | Add `<label>` with `htmlFor` for each |
| `staff-claim-post-view.tsx` | 527–531 | User search `<input>` has no `<label>` | Add `<label className="sr-only" htmlFor="claimer-search">Search by name or email</label>` and `id="claimer-search"` |

---

## 14. Accessibility — `<button>` Without `type` Attribute

Current status: Completed for the cited first-pass issues.

**Rule:** All `<button>` elements that are not form submit buttons should have `type="button"` to prevent accidental form submission.

### `src/components/staff/staff-top-nav.tsx`

Every `<button>` in this file is missing `type="button"`. They default to `type="submit"`, which can cause unintended form submissions if ever wrapped in a form.

Note: this file is also dead code (zero importers) and should be deleted (§7).

### `src/components/staff/compact-post-card.tsx:174`

```tsx
// Bad — Share button has no type and no onClick handler (dead button)
<button className="inline-flex ...">
  <Share2 className="size-4" /> Share
</button>

// Fix — add type="button" and wire up an actual handler, or remove it
<button
  type="button"
  onClick={(event) => {
    event.stopPropagation();
    // handle share
  }}
  className="inline-flex ..."
>
  <Share2 className="size-4" /> Share
</button>
```

---

## 15. Duplicate Components

Current status: Completed. Admin/staff profile pages now share `src/components/profile/profile-view.tsx`.

`src/components/admin/admin-profile-view.tsx` and `src/components/staff/staff-profile-view.tsx` are nearly identical — same layout, same logic, same `UpdatePictureFromGoogleButton`, only the fallback name strings differ (`"Admin User"` vs `"Staff User"`).

```typescript
// Fix — extract a shared ProfileView component
interface ProfileViewProps {
  fallbackName: string;
}

export function ProfileView({ fallbackName }: ProfileViewProps) { ... }

// Then in each page
<ProfileView fallbackName="Admin User" />
<ProfileView fallbackName="Staff User" />
```

---

## Priority Order

| Priority | Items |
|---|---|
| P1 — Correctness/Architecture | §3 (server data in Zustand), §5 (useEffect fetching), §4 (missing useShallow) |
| P2 — Maintainability | §8 (component size), §9 (useReducer), §11 (duplicate helpers) |
| P3 — Standards compliance | §2 (types), §6 (type from component), §10 (function in component), §12 (useMemo), §15 (duplicate components) |
| P4 — Cleanup | §7 (dead code), §1 (file naming) |
| P5 — Accessibility | §13 (unlabeled inputs), §14 (button type) |

---

# Pass 3 — Experiences Audit

Reference: `~/.claude/home-files/experiences.md`
Scope: All files under `src/`

---

## P3-1. Shared Mutation Pending State Across a List

Current status: Completed. `staff-dashboard-view-sections.tsx` now scopes `actionsDisabled` to `pendingDecisionPostId === post.postId && isSubmittingDecision`.

**Rule:** Per-item actions must track loading state per item, not globally. A global `isPending` flag disables all list items when any one is processing.

### `src/components/staff/staff-dashboard-view.tsx:255`

```tsx
// Bad — isSubmittingDecision is a single boolean shared across all cards.
// When any card's decision is submitting, ALL cards get disabled.
{posts.map((post) => (
  <CompactPostCard
    post={post}
    onAccept={handleAccept}
    onReject={handleReject}
    actionsDisabled={isSubmittingDecision}          // ← global flag kills all cards
    loadingAction={pendingDecisionPostId === post.postId ? pendingDecisionType : null}
  />
))}
```

The `pendingDecisionPostId` already tracks which card is loading (used for the spinner), but `actionsDisabled` uses the global boolean instead of scoping it to that card.

```tsx
// Fix — scope disabled state to the specific card in flight
actionsDisabled={pendingDecisionPostId === post.postId && isSubmittingDecision}
```

Users can still act on other posts while one decision is processing.

---

## P3-2. No Sensitive Data in Logs

Current status: Completed. The remaining raw `console.error(error)` usages under `src/` were replaced with safe string logging through `src/lib/error-utils.ts`.

**Rule:** Never log raw error objects. They can contain stack traces, API response bodies, auth tokens, SQL fragments, or PII. Log a safe identifier and the error message string only; let an error monitoring tool handle the full trace.

28 `console.error` calls found across 11 files, all passing a raw `error`/`err`/`e` object:

| File | Line(s) | Call |
|---|---|---|
| `src/components/admin/admin-sidebar.tsx` | 37 | `console.error("Failed to fetch unread count:", error)` |
| `src/components/staff/staff-sidebar.tsx` | 57 | `console.error("Failed to fetch unread count:", error)` |
| `src/components/staff/staff-claim-post-view.tsx` | 303 | `console.error("Claim submission error:", err)` |
| `src/lib/date-utils.ts` | 27, 55, 86 | `console.error("Error formatting date:", error)` / `"Error calculating relative time:", error` |
| `src/app/admin/audit-log/page.tsx` | 132 | `console.error("Failed to fetch audit logs:", error)` |
| `src/app/admin/announcement/page.tsx` | 105 | `console.error("Error loading announcements", error)` |
| `src/app/admin/generate-announcement/page.tsx` | 100, 128, 148 | `console.error(...)` |
| `src/app/admin/page.tsx` | 554, 570, 586, 643, 699 | `console.error(...)` |
| `src/app/admin/admin-management/page.tsx` | 351, 376, 437, 499, 573, 653, 683 | `console.error(...)` |
| `src/app/staff/notifications/page.tsx` | 35, 48, 57, 67, 77 | `console.error(...)` |

```typescript
// Bad — logs the full error object; can contain response body, stack trace, token data
console.error("Failed to fetch audit logs:", error);

// Fix — log a safe string; let error monitoring capture the full error separately
console.error("Failed to fetch audit logs:", error instanceof Error ? error.message : String(error));
```

For production, these `console.error` calls should be replaced with a proper error monitoring integration (e.g., Sentry). Until then, at minimum log only `error.message`, not the full object.

---

## P3-3. Raw API Exception Messages Exposed to Client

Current status: Completed. `staff-claim-post-view.tsx` now logs the error safely and always shows a generic failure toast instead of surfacing a backend-provided message.

**Rule:** Never pass raw server-provided error messages directly to user-facing UI. Backend messages can leak internal system details (DB errors, service names, stack fragments). Always show a generic fallback.

### `src/components/staff/staff-claim-post-view.tsx:300-310`

```typescript
// Bad — server's raw message piped directly into a user-visible toast
try {
  ...
} catch (err) {
  console.error("Claim submission error:", err);
  let errorMessage = "Failed to submit claim. Please try again.";
  if (axios.isAxiosError(err) && err.response) {
    const response = err.response as { data?: { message?: string } };
    if (response.data?.message) {
      errorMessage = response.data.message;  // ← raw API message shown to user
    }
  }
  showToast(errorMessage, "error");
}
```

The fallback is correct (`"Failed to submit claim. Please try again."`), but it's overridden whenever the server sends any `message` field.

```typescript
// Fix — always use the generic fallback; log the server detail only
} catch (err) {
  if (axios.isAxiosError(err)) {
    console.error(
      "Claim submission error:",
      err.response?.data?.message ?? err.message
    );
  } else {
    console.error("Claim submission error:", err instanceof Error ? err.message : String(err));
  }
  showToast("Failed to submit claim. Please try again.", "error");
}
```

---

## P3-4. Auth Hydration Flash

Current status: Completed. `create-post-view.tsx` now relies on `useCurrentUser().isLoading`, which covers both the initial `"idle"` state and the `"loading"` state during hydration.

**Rule:** The guard for pre-hydration must cover both `"loading"` and `"idle"` (the initial state before `hydrateUser()` has been called). Guarding only on `"loading"` means the full page renders for one frame before hydration begins.

### `src/components/staff/create-post-view.tsx`

```typescript
// Bad — initial Zustand auth-store state is "idle", not "loading".
// hydrateUser() is called in a useEffect which runs AFTER the first render.
// On the first render: authStatus === "idle", hasFetched === false →
// this guard is skipped → the full form renders → user sees it briefly
if (authStatus === "loading") {
  return <div className="..."><div className="...animate-spin" /></div>;
}
```

The `use-current-user.ts` hook already handles this correctly:

```typescript
// src/hooks/use-current-user.ts — correct implementation
isLoading: status === "loading" || (status === "idle" && !hasFetched),
```

The fix in `create-post-view.tsx` is to consume this hook instead of reading `authStatus` directly from the store:

```typescript
// Fix — replace the three separate useAuthStore selector calls + standalone useEffect
// with the hook that already handles the idle→loading transition correctly
const { user, isLoading: authLoading } = useCurrentUser();

if (authLoading) {
  return <div className="..."><div className="...animate-spin" /></div>;
}
```

This also eliminates the duplicate `hydrateUser()` `useEffect` that `create-post-view.tsx` currently runs alongside `use-current-user.ts`.

---

## Pass 3 — Priority

| Priority | Items |
|---|---|
| P1 — Correctness | P3-4 (auth hydration flash — wrong UI shown before auth resolves) |
| P2 — Security | P3-3 (raw API messages to client), P3-2 (sensitive data in logs) |
| P3 — UX Logic | P3-1 (shared mutation pending state — all cards freeze) |
