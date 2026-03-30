# Cybersecurity Hardening — Astro-Chat / Otto

This skill defines mandatory security protocols for the Astro-Chat codebase. Every contributor and agent MUST follow these rules. Violations are blockers — no exceptions.

---

## 1. SQL Injection Prevention

### Rules
- **BANNED**: Raw template strings in any database query. No `` `SELECT * FROM ${table} WHERE id = ${id}` `` — ever.
- **REQUIRED**: Use the Supabase client methods exclusively (`.from().select()`, `.from().insert()`, `.from().update()`, `.from().delete()`).
- **RPC calls**: Always use `supabase.rpc('function_name', { param: value })` with typed parameters. Never concatenate user input into RPC names or arguments.
- **Edge cases**: If raw SQL is unavoidable (e.g., migrations), use parameterized queries with `$1, $2` placeholders. Never interpolate variables.

### Detection
- Grep for `` ` `` template literals near `supabase`, `sql`, `query`, `SELECT`, `INSERT`, `UPDATE`, `DELETE`.
- Flag any `String.raw`, string concatenation, or `.textContent` injected into query contexts.

---

## 2. IDOR & Authentication Enforcement

### Rules
- **NEVER trust `user_id` from request bodies, URL params, or headers.** Always derive it from the Supabase JWT session:
  ```ts
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id; // THIS is the only trusted source
  ```
- **Every Server Action** (`app/actions/*.ts`) must call `supabase.auth.getUser()` as its first operation and return early if `!user`.
- **Every API Route** (`app/api/**/route.ts`) must authenticate before any data access.
- **Ownership checks**: All read/update/delete queries MUST include `.eq("user_id", user.id)` to prevent cross-user data access.
- **No admin shortcuts**: Even internal tooling must authenticate. No "skip auth in dev" flags.

### Detection
- Scan for `req.body.user_id`, `req.body.userId`, `params.userId` — these are IDOR vectors.
- Verify every `DELETE` and `UPDATE` query chains `.eq("user_id", ...)`.

---

## 3. DDoS & Rate Limiting

### Protocol
- **Target routes**: `/api/chat`, `/api/exams/generate`, `/api/flashcards/generate` — these invoke AI models and are expensive.
- **Implementation**: Use Upstash Redis (`@upstash/ratelimit`) or Vercel KV for distributed rate limiting.
- **Limits**:
  | Route | Window | Max Requests |
  |---|---|---|
  | `/api/chat` | 1 minute | 20 |
  | `/api/exams/generate` | 1 minute | 5 |
  | `/api/flashcards/generate` | 1 minute | 5 |
  | All other `/api/*` | 1 minute | 60 |
- **Max payload size**: 4 KB for all POST bodies. Reject with 413 if exceeded.
- **Response on limit**: HTTP 429 `{ error: "RATE_LIMIT_EXCEEDED", retryAfter: <seconds> }`.
- **Identifier**: Use `user.id` for authenticated requests, IP address (via `x-forwarded-for`) for unauthenticated.

### Implementation Pattern
```ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(20, "1 m"),
  analytics: true,
});

// In route handler:
const identifier = user?.id ?? ip;
const { success, limit, reset, remaining } = await ratelimit.limit(identifier);
if (!success) {
  return Response.json(
    { error: "RATE_LIMIT_EXCEEDED", retryAfter: Math.ceil((reset - Date.now()) / 1000) },
    { status: 429 }
  );
}
```

---

## 4. XSS & Output Sanitization

### Rules
- **`dangerouslySetInnerHTML` is a red flag.** Every use MUST be preceded by sanitization with `DOMPurify` (or `isomorphic-dompurify` for SSR).
  ```ts
  import DOMPurify from "isomorphic-dompurify";
  const clean = DOMPurify.sanitize(dirty, { ALLOWED_TAGS: ["b", "i", "em", "strong", "p", "br", "ul", "ol", "li", "code", "pre"] });
  ```
- **AI responses**: All AI-generated content (chat responses, exam feedback, flashcard text) must be rendered via React's default JSX escaping or explicitly sanitized if using innerHTML.
- **Knowledge Graph nodes**: `chats.title` values displayed in the graph visualization must be escaped. No raw HTML rendering.
- **User input reflection**: Any user input displayed back (topic names, exam titles, search queries) must go through React's default escaping — never use `innerHTML` for these.
- **Markdown rendering**: If using a markdown library (e.g., `react-markdown`), configure it to disallow raw HTML (`allowedElements` whitelist).

### Detection
- Grep for `dangerouslySetInnerHTML`, `innerHTML`, `outerHTML`, `document.write`.
- Verify each instance has a sanitization step immediately before it.

---

## 5. Vibe-Coding Guardrails

### Env Leak Prevention
- **Client Components** (`"use client"`) must NEVER access `process.env` variables that don't start with `NEXT_PUBLIC_`.
- Detection: Grep for `process.env.(?!NEXT_PUBLIC_)` in any file containing `"use client"`.
- Only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are allowed client-side.

### Dependency Auditing
- Run `pnpm audit` before every production build. Any `critical` or `high` severity vulnerability is a build blocker.
- Keep `pnpm-lock.yaml` committed. Never use `--no-lockfile`.
- Review new dependencies for supply chain risk: check download count, maintainer count, last publish date.

### Secret Hygiene
- `.env.local` is in `.gitignore` — verify this periodically.
- Never log, serialize to JSON, or include in error messages: `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`.
- Grep for these key names in client-accessible code paths as part of every audit.

### Headers & CORS
- Ensure `next.config.js` sets security headers:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
- API routes should not set `Access-Control-Allow-Origin: *` unless explicitly required.

---

## Audit Checklist (Quick Reference)

| Check | Command / Method | Pass Criteria |
|---|---|---|
| No raw SQL | `grep -rn "SELECT\|INSERT\|UPDATE\|DELETE" app/ lib/` | Zero hits outside migrations |
| Auth on all routes | Manual review of `app/api/**/route.ts` | Every handler calls `getUser()` first |
| No body-trusted userId | `grep -rn "body.user_id\|body.userId" app/` | Zero hits |
| Payload size enforced | Check route handlers | 4KB limit on POST bodies |
| No env leaks | `grep -rn "process.env" --include="*.tsx" --include="*.ts" app/ components/` | Only `NEXT_PUBLIC_*` in client files |
| XSS safe | `grep -rn "dangerouslySetInnerHTML\|innerHTML" components/ app/` | All instances sanitized |
| Dependencies clean | `pnpm audit` | No critical/high vulnerabilities |
