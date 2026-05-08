# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: staff/dashboard.spec.ts >> Staff Dashboard >> staff match searches for similar items before notifying the owner
- Location: e2e/tests/staff/dashboard.spec.ts:54:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: 'Match' })
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByRole('button', { name: 'Match' })

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - button "Open Next.js Dev Tools" [ref=e7] [cursor=pointer]:
    - img [ref=e8]
  - alert [ref=e11]
  - main [ref=e12]:
    - img "University of Makati admin building" [ref=e14]
    - generic [ref=e19]:
      - generic [ref=e20]:
        - generic [ref=e21]: UMak-LINK Web
        - generic [ref=e22]: Admin and Staff Portal
        - paragraph [ref=e23]: A web control center for staff operations, approvals, fraud handling, and campus-wide notifications.
        - generic [ref=e25]:
          - button "Sign In With UMak Email" [ref=e26]
          - button [ref=e30] [cursor=pointer]:
            - img [ref=e33]
      - generic [ref=e40]:
        - generic [ref=e41]:
          - img [ref=e43]
          - paragraph [ref=e47]: Post Moderation
        - generic [ref=e48]:
          - img [ref=e50]
          - paragraph [ref=e53]: Fraud Reports
        - generic [ref=e54]:
          - img [ref=e56]
          - paragraph [ref=e68]: Role Management
        - generic [ref=e69]:
          - img [ref=e71]
          - paragraph [ref=e76]: Announcements
```

# Test source

```ts
  67  |       item_name: 'Black Wallet',
  68  |       item_description: 'Black leather wallet',
  69  |       item_type: 'missing' as const,
  70  |       item_image_url: 'https://via.placeholder.com/300x300',
  71  |       category: 'Accessories',
  72  |       last_seen_at: '2026-05-01T00:00:00.000Z',
  73  |       last_seen_location: 'HPSB > 11 Floor > Clinic Room',
  74  |       submission_date: '2026-05-05T00:00:00.000Z',
  75  |       post_status: 'pending',
  76  |       item_status: 'lost',
  77  |       is_anonymous: true,
  78  |     };
  79  | 
  80  |     let matchRequestBody: Record<string, unknown> | null = null;
  81  |     let statusRequestBody: Record<string, unknown> | null = null;
  82  |     let notificationRequestBody: Record<string, unknown> | null = null;
  83  | 
  84  |     await page.route('**/posts**', async (route) => {
  85  |       const url = route.request().url();
  86  |       const method = route.request().method();
  87  | 
  88  |       if (method === 'GET' && url.includes('/posts/count')) {
  89  |         await route.fulfill({
  90  |           status: 200,
  91  |           contentType: 'application/json',
  92  |           body: JSON.stringify({
  93  |             count: url.includes('status=pending') ? 1 : 0,
  94  |           }),
  95  |         });
  96  |         return;
  97  |       }
  98  | 
  99  |       if (method === 'GET') {
  100 |         await route.fulfill({
  101 |           status: 200,
  102 |           contentType: 'application/json',
  103 |           body: JSON.stringify({ posts: [pendingLostPost] }),
  104 |         });
  105 |         return;
  106 |       }
  107 | 
  108 |       if (method === 'PUT' && url.includes('/status')) {
  109 |         statusRequestBody = route.request().postDataJSON() as Record<string, unknown>;
  110 |         await route.fulfill({
  111 |           status: 200,
  112 |           contentType: 'application/json',
  113 |           body: JSON.stringify({ success: true }),
  114 |         });
  115 |         return;
  116 |       }
  117 | 
  118 |       await route.continue();
  119 |     });
  120 | 
  121 |     await page.route('**/notifications/count**', async (route) => {
  122 |       await route.fulfill({
  123 |         status: 200,
  124 |         contentType: 'application/json',
  125 |         body: JSON.stringify({ unread_count: 0 }),
  126 |       });
  127 |     });
  128 | 
  129 |     await page.route('**/search/match-missing-item', async (route) => {
  130 |       matchRequestBody = route.request().postDataJSON() as Record<string, unknown>;
  131 |       await route.fulfill({
  132 |         status: 200,
  133 |         contentType: 'application/json',
  134 |         body: JSON.stringify({
  135 |           success: true,
  136 |           matches: [
  137 |             {
  138 |               post_id: 123,
  139 |               item_type: 'found',
  140 |               item_name: 'Black Wallet',
  141 |               category: 'Accessories',
  142 |             },
  143 |           ],
  144 |           missing_post: {
  145 |             post_id: 456,
  146 |             item_type: 'missing',
  147 |             item_name: 'Black Wallet',
  148 |             category: 'Accessories',
  149 |           },
  150 |           total_matches: 1,
  151 |         }),
  152 |       });
  153 |     });
  154 | 
  155 |     await page.route('**/notifications/send', async (route) => {
  156 |       notificationRequestBody = route.request().postDataJSON() as Record<string, unknown>;
  157 |       await route.fulfill({
  158 |         status: 200,
  159 |         contentType: 'application/json',
  160 |         body: JSON.stringify({ success: true, notification_id: 1 }),
  161 |       });
  162 |     });
  163 | 
  164 |     await page.goto(APP_ROUTES.staff.dashboard);
  165 |     await page.waitForLoadState('networkidle');
  166 | 
> 167 |     await expect(page.getByRole('button', { name: 'Match' })).toBeVisible();
      |                                                               ^ Error: expect(locator).toBeVisible() failed
  168 |     await page.getByRole('button', { name: 'Match' }).click();
  169 | 
  170 |     await expect(page.getByText('1 possible match found; owner notified')).toBeVisible();
  171 |     expect(matchRequestBody).toEqual({ post_id: '456' });
  172 |     expect(statusRequestBody).toEqual({ status: 'accepted' });
  173 |     expect(notificationRequestBody).toMatchObject({
  174 |       user_id: 'user-086',
  175 |       title: 'Found Similar Items',
  176 |       type: 'match',
  177 |       data: {
  178 |         postId: '456',
  179 |         itemId: 'item-456',
  180 |         matched_post_ids: JSON.stringify(['123']),
  181 |         match_count: 1,
  182 |       },
  183 |     });
  184 |   });
  185 | 
  186 |   test('staff can filter by post type (Lost vs Found)', async ({
  187 |     page,
  188 |     staffUser,
  189 |     setAuthToken,
  190 |     mockPostsList,
  191 |   }) => {
  192 |     await setAuthToken(staffUser);
  193 | 
  194 |     await mockPostsList([
  195 |       createMockPost({ post_type: 'Lost' }),
  196 |       createMockPost({ post_type: 'Found' }),
  197 |     ]);
  198 | 
  199 |     await page.goto(APP_ROUTES.staff.dashboard);
  200 | 
  201 |     // Look for filter buttons/tabs
  202 |     const lostFilter = page.locator('button:has-text("Lost"), button[aria-label*="Lost"]');
  203 |     const foundFilter = page.locator('button:has-text("Found"), button[aria-label*="Found"]');
  204 | 
  205 |     // Filters may exist - test if they do
  206 |     if (await lostFilter.count().then((n) => n > 0)) {
  207 |       await lostFilter.first().click();
  208 |       await page.waitForLoadState('networkidle');
  209 | 
  210 |       // Should show only lost items
  211 |       expect(page.url()).toBeTruthy();
  212 |     }
  213 |   });
  214 | 
  215 |   test('staff dashboard shows statistics', async ({
  216 |     page,
  217 |     staffUser,
  218 |     setAuthToken,
  219 |     mockPostsList,
  220 |   }) => {
  221 |     await setAuthToken(staffUser);
  222 | 
  223 |     await mockPostsList([
  224 |       createMockPost({ item_status: 'Pending Verification' }),
  225 |       createMockPost({ item_status: 'Verified' }),
  226 |       createMockPost({ item_status: 'Claimed' }),
  227 |     ]);
  228 | 
  229 |     await page.goto(APP_ROUTES.staff.dashboard);
  230 | 
  231 |     // StaffStatCard renders with known titles from staff-dashboard-view.tsx
  232 |     await page.waitForLoadState('networkidle');
  233 |     const statTitle = page.locator('text=Pending Claims');
  234 |     const hasStats = await statTitle.count().then((n) => n > 0);
  235 |     expect(hasStats).toBeTruthy();
  236 |   });
  237 | 
  238 |   test('staff can refresh posts list', async ({
  239 |     page,
  240 |     staffUser,
  241 |     setAuthToken,
  242 |     mockPostsList,
  243 |   }) => {
  244 |     await setAuthToken(staffUser);
  245 | 
  246 |     const posts = [createMockPost()];
  247 |     await mockPostsList(posts);
  248 | 
  249 |     await page.goto(APP_ROUTES.staff.dashboard);
  250 | 
  251 |     // Look for refresh button
  252 |     const refreshButton = page.locator(
  253 |       'button:has-text("Refresh"), button[aria-label*="Refresh"], button[title*="Refresh"]'
  254 |     );
  255 | 
  256 |     if (await refreshButton.count().then((n) => n > 0)) {
  257 |       await refreshButton.first().click();
  258 |       await page.waitForLoadState('networkidle');
  259 | 
  260 |       // Should still be on dashboard
  261 |       expect(page.url()).toContain('/staff');
  262 |     }
  263 |   });
  264 | 
  265 |   test('staff dashboard handles empty posts list', async ({
  266 |     page,
  267 |     staffUser,
```