# Functional Requirements Audit

Date: 2026-05-07

## Source of Truth

- `DOCUMENTATION/UMak-LINK-Requirements-Specification.md`

## Scope

- Audited project: `umak-link-web`
- Audited requirement groups:
  - `Global Module`
  - `Staff Module`
  - `Admin Module`
- Excluded from scope:
  - `User Module`
- Scope clarification applied:
  - This web portal is staff/admin-only.
  - Notifications were interpreted as in-app web notifications/toasts for this portal.
  - Even with that clarification, the documented Notification Center requirements were still audited wherever the spec explicitly requires a notifications page, actions, labels, or navigation behavior.

## Overall Result

`umak-link-web` does not fully satisfy the applicable Functional Requirements as written.

Current state:

- Several staff/admin workflows are implemented only partially.
- Multiple spec-required pages still resolve to placeholders or alternate routes.
- Several exact labels, status messages, and action names do not match the specification.
- Some implemented behaviors regress from the documented flow.

## Verification

- `pnpm build`: passed when rerun outside the sandbox
- `pnpm lint`: failed
  - Result observed during audit: `112 errors`, `26 warnings`
  - Source-level lint failures include:
    - `src/components/staff/staff-dashboard-view-sections.tsx:34`
    - `src/components/staff/fraud-reports-view-sections.tsx:17`
    - `src/components/staff/staff-claim-post-view-sections.tsx:58`
    - `src/components/ui/skeleton.tsx:3`
  - There are also many lint failures in `e2e/`

## Findings

### High Severity

#### 1. Admin notifications page is still a placeholder

- Requirements affected:
  - `Global Module -> 3. Notification Center`
- Status:
  - Not satisfied
- Finding:
  - The admin notifications page is a dummy page and does not implement the required list, read state, per-notification actions, or bulk actions.
- Evidence:
  - `src/app/admin/notifications/page.tsx:1-3`

#### 2. Spec-named Audit Trail route is still a placeholder, while the actual nav points elsewhere

- Requirements affected:
  - `Global Module -> 4. Item Search and Filter -> Admin Audit Trail`
  - `Admin Module -> 22. Administrative Audit Trail`
- Status:
  - Not satisfied as written
- Finding:
  - The specification requires an `Audit Trail` page. The admin navigation points to `Audit Log`, and the actual `audit-trail` route is still a dummy page.
- Evidence:
  - `src/app/admin/routes/admin-routes.ts:15-20`
  - `src/app/admin/audit-trail/page.tsx:1-3`
  - `src/app/admin/audit-log/page.tsx:183-189`

#### 3. Notification deep-link behavior is broken by inconsistent payload shape

- Requirements affected:
  - `Global Module -> 3. Notification Center`
- Status:
  - Not satisfied
- Finding:
  - The notification item component only navigates when notification data contains `url` or `href`.
  - Several emitters send only `postId`, `itemId`, or `link`.
  - Result: many notifications cannot open the required detailed post page or related destination.
- Evidence:
  - Reader expects only `url` or `href`: `src/components/staff/notification-item.tsx:64-79`
  - Staff dashboard sender: `src/components/staff/staff-dashboard-view.tsx:125-139`
  - Post records sender: `src/components/staff/post-records-view.tsx:169-176`
  - Search sender: `src/components/staff/staff-search-view.tsx:208-215`
  - Post detail sender uses `link`, not `url`/`href`: `src/components/staff/post-record-detail-view.tsx:194-200`

#### 4. Profile and settings requirements are not implemented

- Requirements affected:
  - `Global Module -> 2. Profile View`
  - `Global Module -> 5. App Permission and Settings`
- Status:
  - Not satisfied
- Finding:
  - The shared profile page shows name, email, role, a Google-picture update control, and logout.
  - It does not implement:
    - `Settings`
    - permission controls/statuses
    - `Clear Cache` / `Clear All Cache`
    - approval prompts or granted/denied display states
- Evidence:
  - `src/components/profile/profile-view.tsx:29-74`

#### 5. Unauthorized access handling does not follow the documented flow

- Requirements affected:
  - `Global Module -> 8. Unauthorized Access Handling`
- Status:
  - Not satisfied
- Finding:
  - On role mismatch, the route guard redirects users to their allowed home route rather than the unauthorized page described by the spec.
  - The unauthorized page only exposes `Back to Login`, not the required `Go back` and `Go to login page` options/behavior.
- Evidence:
  - `src/components/auth/role-route-guard.tsx:20-31`
  - `src/app/not-allowed/page.tsx:8-17`

#### 6. Staff status-change flow does not satisfy the documented status matrix or notification outcomes

- Requirements affected:
  - `Staff Module -> 17. Item Status Update`
- Status:
  - Partially satisfied
- Finding:
  - The item-status option mapping is reversed from the specification:
    - current code: found -> `claimed`, `unclaimed`, `discarded`
    - current code: missing -> `returned`, `lost`
  - The spec states:
    - missing item -> `claimed`, `unclaimed`, `discarded`
    - found item -> `returned`, `lost`
  - The flow also does not send the documented owner notifications for status changes.
  - Success copy is `Status updated successfully`, not `Status changed successfully.`
- Evidence:
  - Status options: `src/components/staff/post-record-detail-view.tsx:46-61`
  - Success copy: `src/components/staff/post-record-detail-view.tsx:141-144`
  - No owner notifications inside `performStatusChange`: `src/components/staff/post-record-detail-view.tsx:127-152`

#### 7. Staff dashboard is missing required unverified-item actions

- Requirements affected:
  - `Staff Module -> 16. Unverified Item View`
- Status:
  - Partially satisfied
- Finding:
  - The dashboard cards expose `Accept` and `Reject`, but not the required:
    - `Match (Missing)`
    - `Send possible similar item notification (Missing)`
  - There is also a visible `Share` button with no behavior attached.
- Evidence:
  - `src/components/staff/compact-post-card.tsx:118-150`

### Medium Severity

#### 8. Login strings and timeout behavior do not match the specification

- Requirements affected:
  - `Global Module -> 1. Account Authentication`
- Status:
  - Partially satisfied
- Finding:
  - The documented button label `Sign In With UMak Email` is not rendered as an exact visible string; Google Identity renders its own stock button text.
  - The non-UMak error message differs from the required copy.
  - The HTTP client disables timeouts with `timeout: 0`, so the documented timeout path is not implemented as specified.
- Evidence:
  - Non-UMak error: `src/components/auth/GoogleLoginButton.tsx:57-59`
  - Button rendering delegated to Google: `src/components/auth/GoogleLoginButton.tsx:128-140`
  - No request timeout: `src/lib/api.ts:5-8`

Required strings from spec:

- `Sign in failed. Please make sure to use your UMAK Google Account and try again`
- `Request timed out. Please check your internet connection and try again.`

Current strings in code:

- `Please use your organization email to sign in.`
- `Request timeout. Please check your connection and try again.`

#### 9. Staff notifications page action labels do not match the documented labels

- Requirements affected:
  - `Global Module -> 3. Notification Center`
- Status:
  - Partially satisfied
- Finding:
  - The staff notifications page exists and supports read/delete actions, but the visible labels differ from the specification.
- Evidence:
  - Bulk menu: `src/app/staff/notifications/page.tsx:119-133`
  - Single-item menu: `src/components/staff/notification-item.tsx:169-185`

Spec labels:

- `Mark as read`
- `Delete notification`
- `Mark all as read`
- `Delete notifications`

Current labels:

- `Mark as Read`
- `Delete`
- `Mark all as read`
- `Delete all`

#### 10. Search page is missing documented cancel and recent-search behaviors

- Requirements affected:
  - `Global Module -> 4. Item Search and Filter`
- Status:
  - Partially satisfied
- Finding:
  - Advanced search fields exist.
  - Reverse image search exists.
  - The page does not implement:
    - a `Cancel` button
    - recent search history
    - removing individual recent searches
- Evidence:
  - `src/components/staff/staff-search-view-sections.tsx:132-223`

#### 11. Staff share behavior is clipboard-only, not a share modal

- Requirements affected:
  - `Global Module -> 6. Post Sharing`
- Status:
  - Partially satisfied
- Finding:
  - Implemented share behavior copies a link to the clipboard.
  - It does not open a native share modal or equivalent web share flow.
  - The dashboard card share button currently has no handler at all.
- Evidence:
  - Clipboard share in records list: `src/components/staff/post-records-view.tsx:121-127`
  - Clipboard share in detail page: `src/components/staff/post-record-detail-view.tsx:208-215`
  - Unwired dashboard share button: `src/components/staff/compact-post-card.tsx:145-149`

#### 12. Announcement validation and success timing do not match the documented copy

- Requirements affected:
  - `Admin Module -> 23. Announcement and Notification Management`
- Status:
  - Partially satisfied
- Finding:
  - Validation and success behavior are close, but not spec-exact.
  - The empty-field validation message differs.
  - Redirect delay after success is `1500ms`, not the required `1000ms`.
- Evidence:
  - Validation string: `src/app/admin/generate-announcement/page.tsx:76-79`
  - Success and delayed redirect: `src/app/admin/generate-announcement/page.tsx:133-147`

Spec string:

- `Title or Message must not be empty`

Current string:

- `Title or Description must not be empty`

#### 13. Dashboard export flow is incomplete relative to the documented export behavior

- Requirements affected:
  - `Admin Module -> 21. Report Generation`
- Status:
  - Partially satisfied
- Finding:
  - CSV generation exists for both charts.
  - Missing from the documented flow:
    - success toast: `Report exported successfully`
    - failure toast: `Failed to export the chart/report. Please check your connection or storage settings.`
    - network pre-check
    - share flow after export
    - share-failure messaging
- Evidence:
  - Download handlers only create and click a local download link: `src/app/admin/page.tsx:596-700`

#### 14. Administrative audit filtering/display labels diverge from the documented labels

- Requirements affected:
  - `Global Module -> 4. Item Search and Filter -> Admin Audit Trail`
  - `Admin Module -> 22. Administrative Audit Trail`
- Status:
  - Partially satisfied
- Finding:
  - The implemented page uses `Audit Log`, not `Audit Trail`.
  - The sidebar filter uses `User Name`, not `Admin/Staff Name`.
  - End-of-list text is `All audit logs loaded`, not `You're all caught up`.
- Evidence:
  - Title: `src/app/admin/audit-log/page.tsx:183-184`
  - User-name filter label: `src/app/admin/audit-log/page.tsx:408-433`
  - End-of-list copy: `src/app/admin/audit-log/page.tsx:323-325`

#### 15. Admin account-management naming and badge copy differ from the documented strings

- Requirements affected:
  - `Admin Module -> 24. Administrator Account Management`
- Status:
  - Partially satisfied
- Finding:
  - The current page is titled `User Management`, not the documented account-management naming.
  - The current-user badge says `You`, not `Current User`.
- Evidence:
  - Page title: `src/app/admin/admin-management/page.tsx:809-810`
  - Current-user badge: `src/app/admin/admin-management/page.tsx:95-99`

### Lower Severity / Additional Notes

#### 16. Notification center implementation exists only for staff, not for admin

- Requirements affected:
  - `Global Module -> 3. Notification Center`
- Status:
  - Partially satisfied
- Finding:
  - Staff has a real notifications page.
  - Admin does not.
- Evidence:
  - Staff page: `src/app/staff/notifications/page.tsx:16-139`
  - Admin page: `src/app/admin/notifications/page.tsx:1-3`

#### 17. Some implemented flows use alternate naming instead of spec naming

- Examples:
  - `Audit Log` instead of `Audit Trail`
  - `User Management` instead of account-management naming
  - `Delete all` instead of `Delete notifications`
  - `Status updated successfully` instead of `Status changed successfully.`

These are not cosmetic-only issues because the audit treats display text as part of the requirement.

## Requirement Coverage Summary

### Global Module

- `1. Account Authentication`
  - Partially satisfied
- `2. Profile View`
  - Not satisfied
- `3. Notification Center`
  - Partially satisfied
- `4. Item Search and Filter`
  - Partially satisfied
- `5. App Permission and Settings`
  - Not satisfied
- `6. Post Sharing`
  - Partially satisfied
- `7. Network Connectivity Checks`
  - Partially satisfied
- `8. Unauthorized Access Handling`
  - Not satisfied

### Staff Module

- `16. Unverified Item View`
  - Partially satisfied
- `17. Item Status Update`
  - Partially satisfied
- `18. Fraudulent Claim Management`
  - Partially satisfied
- `19. Post Records`
  - Partially satisfied

### Admin Module

- `20. System Overview`
  - Partially satisfied
- `21. Report Generation`
  - Partially satisfied
- `22. Administrative Audit Trail`
  - Partially satisfied
- `23. Announcement and Notification Management`
  - Partially satisfied
- `24. Administrator Account Management`
  - Partially satisfied

## Conclusion

The portal has substantial implementation coverage for staff and admin workflows, but it is not yet compliant with the Functional Requirements document as the source of truth.

The main blocking gaps are:

- placeholder admin routes
- broken notification destination handling
- missing profile/settings/cache functionality
- mismatched status-flow rules
- missing or divergent spec strings
- incomplete export/share/error-handling behavior

