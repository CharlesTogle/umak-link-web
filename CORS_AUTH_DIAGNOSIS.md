# UMAK Link Backend Access Diagnosis

Date: 2026-05-05

## Summary

The original issue looked like a frontend-to-backend CORS failure from the Vercel deployment, but the investigation showed two separate problems:

1. CORS was initially misconfigured because the deployed frontend origin did not exactly match the backend allowlist.
2. After CORS was corrected, `GET /auth/me` still failed with `401 Unauthorized` because the backend was not reading the `Authorization` header correctly.

The frontend is sending a valid `Authorization: Bearer <supabase access token>` header. The backend receives that header in the raw request, but the application code reports it as `undefined`. That strongly indicates a backend header-access bug, most likely reading `request.headers.Authorization` instead of `request.headers.authorization`.

## Final Diagnosis

### Root cause 1: Initial CORS origin mismatch

The backend originally rejected the deployed frontend origin because the allowlist used:

- `https://umak-link-web.vercel.app`
- and sometimes `https://localhost`

but the failing deployed site was also referred to at one point as:

- `https://umak-link.vercel.app`

CORS origin matching is exact. Different subdomains are different origins. A trailing slash also breaks exact matching if the backend compares strings incorrectly.

### Root cause 2: Backend auth header parsing bug

After CORS was fixed, the request still failed with:

```json
{"error":"Unauthorized","message":"No token provided"}
```

But the browser request clearly included:

```text
Authorization: Bearer <token>
```

and the raw headers logged by the backend also showed:

```text
Authorization: Bearer <token>
```

At the same time, the backend log printed:

```text
GET /auth/me undefined
```

That means the backend request handler or auth middleware is reading the header incorrectly.

Most likely fix:

```ts
const authHeader = request.headers.authorization;
```

not:

```ts
const authHeader = request.headers.Authorization;
```

Node/Fastify normalizes header names to lowercase.

## Frontend Findings

### API auth behavior

The frontend sends bearer auth through Axios in [src/lib/api.ts](./src/lib/api.ts).

Current behavior after local changes:

- It uses the Supabase session access token only.
- The legacy local token fallback was removed locally from the frontend code.

Relevant file changes made locally:

- [src/lib/api.ts](./src/lib/api.ts)
- [src/stores/auth-store.ts](./src/stores/auth-store.ts)
- [src/lib/token-storage.ts](./src/lib/token-storage.ts)

### No X-API-KEY

The frontend does not send `X-API-KEY`.

Security-related request behavior in the frontend:

- `Authorization: Bearer <supabase access token>`
- `withCredentials: true`

There is no custom backend secret header in the frontend. Backend protection depends on token verification and authorization logic, not on a frontend-hidden shared secret.

## Environment Variables Reviewed

### `NEXT_PUBLIC_API_URL`

This was confirmed to be correct on the frontend deployment.

Expected value:

```text
https://umak-link-backend.onrender.com
```

### Backend CORS env vars

Observed backend env vars during diagnosis:

`CORS_ORIGIN`

```text
https://umak-link-web.vercel.app,http://localhost:3000,http://localhost,capacitor://localhost
```

and later:

```text
https://umak-link-web.vercel.app,http://localhost:5173,http://localhost:5174,http://localhost:3000,http://localhost,capacitor://localhost
```

`ALLOWED_ORIGINS`

At one point:

```text
http://localhost:5173,http://localhost:5174,http://localhost:3000,https://umak-link-web.vercel.app/
```

This had a bad trailing slash on the Vercel origin:

```text
https://umak-link-web.vercel.app/
```

Later updated to:

```text
https://umak-link-web.vercel.app,http://localhost:5173,http://localhost:5174,http://localhost:3000,http://localhost,capacitor://localhost
```

## What We Tested

### 1. Browser error on `/auth/me`

Observed:

```text
Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource at https://umak-link-backend.onrender.com/auth/me. (Reason: CORS request did not succeed). Status code: (null).
```

Result:

- Initially suggested either CORS or transport failure.
- Not enough by itself to identify the exact cause.

Status:

- Inconclusive by itself

### 2. Backend log showing legacy JWT failure then success

Observed:

```text
Token was not a valid legacy JWT, trying Supabase auth
JsonWebTokenError: invalid signature
request completed statusCode: 200
```

Result:

- Confirmed backend supports a hybrid auth path:
  - tries legacy JWT first
  - then falls back to Supabase auth
- Showed at least one request to `/auth/me` reached the backend and succeeded

Status:

- Worked
- Helped rule out complete backend outage

### 3. Mobile request logs for `/notifications/count`

Observed:

- `OPTIONS /notifications/count -> 204`
- `GET /notifications/count -> 200`

Result:

- Confirmed mobile requests could reach Render
- Confirmed at least one endpoint had working preflight and actual request flow

Status:

- Worked

### 4. `curl -X POST https://umak-link-backend.onrender.com/auth/me`

Observed:

```json
{"message":"Route POST:/auth/me not found","error":"Not Found","statusCode":404}
```

Result:

- Confirmed the backend was reachable
- Did not test the actual app behavior because the frontend uses `GET /auth/me`, not `POST`

Status:

- Worked as connectivity check
- Not useful for auth diagnosis

### 5. `curl` with Vercel origin and dummy bearer token

Command:

```bash
curl -i \
  -H 'Origin: https://umak-link.vercel.app' \
  -H 'Authorization: Bearer test' \
  https://umak-link-backend.onrender.com/auth/me
```

Observed:

```text
HTTP/2 500
{"statusCode":500,"error":"Internal Server Error","message":"CORS origin not allowed"}
```

Result:

- Proved the backend was explicitly rejecting that origin
- Confirmed a CORS allowlist mismatch existed

Status:

- Worked
- Identified initial CORS misconfiguration

### 6. Review of CORS env vars

Observed:

- Vercel origin mismatch between `umak-link.vercel.app` and `umak-link-web.vercel.app`
- Trailing slash in one allowlist entry

Result:

- Showed exact-match CORS problems

Status:

- Worked

### 7. Browser Network tab showed `Authorization` header present

Observed request headers included:

```text
Authorization: Bearer eyJ...
Origin: https://umak-link-web.vercel.app
```

Result:

- Proved the frontend was sending a bearer token
- Ruled out “frontend forgot to send auth” for that request

Status:

- Worked

### 8. Supabase project URL check

Observed token issuer:

```text
https://uhpcewmjeigrddvauzce.supabase.co/auth/v1
```

Reviewed project URL:

```text
https://uhpcewmjeigrddvauzce.supabase.co
```

Result:

- Confirmed the Supabase base URL matched the token issuer
- Reduced likelihood of “wrong Supabase project URL” as the cause

Status:

- Worked

### 9. Browser screenshot of failing network sequence

Observed:

- Google token exchange request succeeded with `200`
- `OPTIONS /auth/me` showed `CORS Failed`
- Google `play.google.com/log` request failed separately

Result:

- Confirmed the important failing request was the backend preflight
- Confirmed the Google log error was unrelated noise

Status:

- Worked

### 10. Explicit preflight test with `curl`

Command:

```bash
curl -i -X OPTIONS \
  -H 'Origin: https://umak-link-web.vercel.app' \
  -H 'Access-Control-Request-Method: GET' \
  -H 'Access-Control-Request-Headers: authorization' \
  https://umak-link-backend.onrender.com/auth/me
```

Observed:

```text
HTTP/2 204
access-control-allow-credentials: true
access-control-allow-headers: authorization
access-control-allow-methods: GET,HEAD,PUT,PATCH,POST,DELETE
access-control-allow-origin: https://umak-link-web.vercel.app
```

Result:

- Proved CORS preflight is now configured correctly
- Ruled out current CORS failure as the main blocker

Status:

- Worked
- Confirmed CORS fix

### 11. `GET /auth/me` returned `401`

Observed backend log:

```text
incoming request GET /auth/me
request completed statusCode: 401
```

Observed response:

```json
{"error":"Unauthorized","message":"No token provided"}
```

Result:

- Confirmed the backend request reached the route
- Shifted diagnosis from CORS to backend auth header handling

Status:

- Worked

### 12. Raw backend headers dump

Observed raw request headers included:

```text
Authorization: Bearer eyJ...
Origin: https://umak-link-web.vercel.app
```

but application log output still showed:

```text
GET /auth/me undefined
```

Result:

- Proved the header reaches the backend
- Proved the app code is failing to read it correctly

Status:

- Worked
- Strongest evidence for the actual bug

## What Did Not Turn Out To Be The Main Issue

### `NEXT_PUBLIC_API_URL`

Checked and confirmed correct.

Status:

- Not the issue

### Missing X-API-KEY

There is no `X-API-KEY` in the frontend, but that is not a bug by itself.

Status:

- Not the issue

### `play.google.com/log` CORS failure

This is Google logging/telemetry noise and not the backend auth blocker.

Status:

- Not the issue

### Supabase base project URL mismatch

The provided project URL matches the token issuer.

Status:

- Not the issue

## Recommended Backend Fix

In the backend auth middleware or `/auth/me` handler, make sure the token is read from the lowercase header key:

```ts
const authHeader = request.headers.authorization;

if (!authHeader?.startsWith("Bearer ")) {
  return reply.status(401).send({
    error: "Unauthorized",
    message: "No token provided",
  });
}

const token = authHeader.slice("Bearer ".length);
```

If the code currently uses `request.headers.Authorization`, change it to lowercase.

## Recommended Follow-Up Verification

After fixing backend header access:

1. Redeploy or restart the backend.
2. Sign in again from `https://umak-link-web.vercel.app`.
3. Verify `GET /auth/me` no longer returns:

```json
{"error":"Unauthorized","message":"No token provided"}
```

4. Confirm backend logs show the auth header is read correctly.
5. If a new `401` appears after that, log whether the token then fails during:
   - Supabase token verification
   - user lookup
   - role authorization

## Repo Change Made During Investigation

A local frontend cleanup was made to remove the legacy token fallback so the frontend now uses Supabase session tokens only.

Files changed:

- [src/lib/api.ts](./src/lib/api.ts)
- [src/stores/auth-store.ts](./src/stores/auth-store.ts)
- [src/lib/token-storage.ts](./src/lib/token-storage.ts)

Note:

- This only affects deployments after the frontend is redeployed.
- It does not fix the backend header parsing bug by itself.
