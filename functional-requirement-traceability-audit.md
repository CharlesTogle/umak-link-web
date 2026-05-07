# Functional Requirement Traceability Audit

Date: 2026-05-07

## Source of Truth

- `DOCUMENTATION/UMak-LINK-Requirements-Specification.md`

## Scope

- Audited apps:
  - `umak-link-web`
  - `umak-link-backend`
- Audit baseline:
  - The requirements specification is treated as the source of truth.
- Scope clarification from product direction:
  - End User / Student pages are not included in the web portal.
  - For `umak-link-web`, student-facing UI requirements were treated as out of scope.
  - Those same requirements were still checked against `umak-link-backend` where route behavior or contracts are relevant.

## Overall Verdict

The current implementation does not fully satisfy the documented Functional Requirements as written.

The most significant gaps are:

- admin notifications are not implemented in the web portal,
- the spec-named audit trail route is not implemented as written,
- several notification, claim, fraud-report, and status-change flows regress from the documented behavior,
- several string labels and success/error messages do not match the specification exactly,
- some backend contracts do not enforce the documented rules.

## Findings

### High Severity

#### 1. `FR-03` Admin notification center is not implemented, and notification contracts are inconsistent

- Status:
  - Not satisfied
- Finding:
  - The admin notifications page is a placeholder.
  - Staff notification deep-link navigation is broken by inconsistent payload shapes.
  - Backend notification `read` and `delete` mutations are not scoped to the current recipient.
- Evidence:
  - `src/app/admin/notifications/page.tsx:1`
  - `src/components/staff/notification-item.tsx:64`
  - `../umak-link-backend/src/routes/notifications.ts:167`

#### 2. `FR-22` The required `Audit Trail` page is not implemented as written

- Status:
  - Partially satisfied
- Finding:
  - The specification requires an `Audit Trail` route and label.
  - The admin nav uses `Audit Log`.
  - The actual `audit-trail` route is still a placeholder.
  - The implemented page also uses non-spec labels such as `Audit Log`.
- Evidence:
  - `src/app/admin/routes/admin-routes.ts:15`
  - `src/app/admin/audit-trail/page.tsx:1`
  - `src/app/admin/audit-log/page.tsx:183`

#### 3. `FR-09` and `FR-10` Backend post rules are not enforced strictly, and image upload is over-constrained

- Status:
  - Partially satisfied
- Finding:
  - Backend post creation still requires `p_image_hash`.
  - That conflicts with the documented optional image upload behavior for found-item posting.
  - Edit and delete routes do not show route-layer enforcement for the documented pending/rejected-only user management rules.
- Evidence:
  - `../umak-link-backend/src/routes/posts/write.ts:17`
  - `../umak-link-backend/src/routes/posts/write.ts:135`
  - `../umak-link-backend/src/routes/posts/write.ts:177`

#### 4. `FR-17` Claiming and status-change flow is not compliant with the documented process

- Status:
  - Partially satisfied
- Finding:
  - Web collects `Date/Time Claimed` but does not submit it.
  - Backend claim schema does not accept an editable claimed date/time field.
  - The web status-change modal reverses the documented item-status mapping.
  - Owner notifications for post/item status changes are missing from the implemented flow.
- Evidence:
  - `src/components/staff/staff-claim-post-view-sections.tsx:219`
  - `src/components/staff/staff-claim-post-view.tsx:142`
  - `../umak-link-backend/src/routes/claims.ts:17`
  - `src/components/staff/post-record-detail-view.tsx:46`

#### 5. `FR-16` Staff dashboard is missing required Missing-item actions

- Status:
  - Partially satisfied
- Finding:
  - The dashboard exposes `Accept` and `Reject`.
  - It does not implement the required Missing-item actions:
    - `Match`
    - `Send possible similar item notification`
  - A visible `Share` action is present but has no behavior attached.
- Evidence:
  - `src/components/staff/compact-post-card.tsx:118`

#### 6. `FR-18` Fraud-report management diverges from the specification

- Status:
  - Partially satisfied
- Finding:
  - The web action gating does not follow the documented `Under Review` and `Open` states.
  - The close flow is missing the required checkbox confirmation.
  - The implemented open flow does not align with the required claimer-email behavior.
- Evidence:
  - `src/components/staff/fraud-report-detail-view.tsx:152`
  - `src/components/staff/fraud-report-detail-view-sections.tsx:246`
  - `../umak-link-backend/src/routes/fraud-reports.ts:242`

#### 7. `FR-23` Announcements are not admin-only in backend, and notification type values do not match web expectations

- Status:
  - Partially satisfied
- Finding:
  - Announcement sending is protected by `requireStaff`, not `requireAdmin`.
  - Backend emits notification type `announcement`.
  - Web expects `global_announcement`.
  - This creates display and prioritization mismatches for announcement notifications.
- Evidence:
  - `../umak-link-backend/src/routes/announcements.ts:10`
  - `../umak-link-backend/src/services/notifications.ts:355`
  - `src/types/notifications.ts:10`

### Medium Severity

#### 8. `FR-01`, `FR-07`, and `FR-08` Auth, timeout, and unauthorized-access flows are not spec-exact

- Status:
  - Partially satisfied
- Finding:
  - The non-UMak sign-in message does not match the documented string.
  - API timeout handling is effectively disabled in web.
  - Role mismatch redirects to the user home route instead of following the documented unauthorized-access flow.
- Evidence:
  - `src/components/auth/GoogleLoginButton.tsx:57`
  - `src/lib/api.ts:5`
  - `src/components/auth/role-route-guard.tsx:20`

#### 9. `FR-02` and `FR-05` Profile/settings requirements are incomplete in web

- Status:
  - Not satisfied
- Finding:
  - Profile details and logout exist.
  - Permission settings, app permission displays, and cache-clearing controls are not implemented.
- Evidence:
  - `src/components/profile/profile-view.tsx:29`

#### 10. `FR-10`, `FR-20`, `FR-21`, and `FR-24` Several implemented flows exist but do not follow the documented labels or outcomes exactly

- Status:
  - Partially satisfied
- Finding:
  - Create-post UI states the report is posted immediately instead of being sent for review.
  - Admin dashboard range labels differ from the specification.
  - Report export is download-only in web and does not implement share flow.
  - Account-management labels and messages diverge from the documented copy.
- Evidence:
  - `src/components/staff/create-post-view.tsx:52`
  - `src/app/admin/page.tsx:24`
  - `src/app/admin/admin-management/page.tsx:97`

## Traceability Matrix

Legend:

- `S` = Satisfied
- `P` = Partially satisfied
- `N` = Not satisfied
- `NA` = Not applicable in that app

| FR | Requirement | Web | Backend | Notes |
| --- | --- | --- | --- | --- |
| FR-01 | Account Authentication | P | P | Auth works, but strings and timeout behavior diverge |
| FR-02 | Profile Page | P | NA | Profile exists; settings and permissions are missing |
| FR-03 | Notification Center | N | P | Admin notifications page missing; notification contract issues remain |
| FR-04 | Item Search and Filter | P | S | Staff search exists; web misses some documented UX behaviors |
| FR-05 | App Permissions and Settings | N | NA | Permission settings are absent in web |
| FR-06 | Post Sharing | P | NA | Clipboard sharing exists; share flow is incomplete |
| FR-07 | Network Connectivity Checks | P | P | Connectivity handling exists but is inconsistent and not spec-exact |
| FR-08 | Unauthorized Access Handling | P | S | Access is blocked; web flow and copy differ from the specification |
| FR-09 | Item Posting and Management (Missing) | NA | P | Student web excluded; backend rule enforcement is incomplete |
| FR-10 | Item Posting and Management (Found) | P | P | Staff found-item flow exists; image requirement conflicts with spec |
| FR-11 | Fraudulent Claim Reporting (User) | NA | S | Student web excluded; backend creation route exists |
| FR-12 | Post History (User) | NA | S | Student web excluded; backend own-post listing is present |
| FR-13 | User Home Page | NA | P | Student web excluded; backend public-feed coverage is incomplete for full FR wording |
| FR-14 | System Credits Display | NA | NA | Not part of the audited web/backend implementation scope |
| FR-15 | Information Display | NA | NA | Not part of the audited web/backend implementation scope |
| FR-16 | Unverified Item View (Staff) | P | P | Pending-items view exists; required Missing-item actions are incomplete |
| FR-17 | Item Status Update (Staff) | P | P | Claim/status flows diverge from documented behavior |
| FR-18 | Fraudulent Claim Management (Staff) | P | P | Fraud-report flow exists but is not spec-compliant end-to-end |
| FR-19 | Post Records (Staff) | P | S | Records/API exist; some web filters/actions differ from spec |
| FR-20 | System Overview (Admin) | P | P | Dashboard exists; labels, error handling, and share behavior differ |
| FR-21 | Report Generation (Admin) | P | S | Export API exists; web lacks share flow and full spec messaging |
| FR-22 | Administrative Audit Trail | P | P | Backend audit APIs exist; web route and copy mismatch |
| FR-23 | Announcement and Notification Management (Admin) | P | P | Announcements/history exist; auth and notification-type mismatches remain |
| FR-24 | Administrator Account Management | P | S | Core role APIs exist; web UX and labels differ from documented flow |

## Verification

### Commands Run

- `pnpm lint` in `umak-link-web`
- `pnpm build` in `umak-link-web`
- `pnpm lint` in `umak-link-backend`
- `pnpm build` in `umak-link-backend`
- `pnpm test` in `umak-link-backend`

### Results

- `umak-link-web`
  - `pnpm build`: passed
  - `pnpm lint`: failed with `112 errors` and `26 warnings`
- `umak-link-backend`
  - `pnpm build`: passed
  - `pnpm lint`: failed with `1 error` and `5 warnings`
  - `pnpm test`: passed with `13` tests

## Notes

- This audit is intentionally conservative.
- If the current implementation differs from the specification, the specification was treated as correct.
- Some user-facing requirements marked `NA` for web may still require a separate audit of `UMak-LINK/` for full end-user compliance.
