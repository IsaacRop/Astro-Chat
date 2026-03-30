---
description: Multi-agent collaborative code review — triggered by /review-code
---

# Peer Review Workflow — `/review-code`

This workflow defines a **structured, multi-agent review chain** for new features, fixes, and refactors before merge. Each agent has a mandatory, non-skippable turn. A **CRITICAL** finding from `@security-expert` immediately halts the chain until the issue is resolved.

**Agents (in order):** `@engineer` → `@security-expert` → `@tutor` → `@qa` → `@engineer` (Synthesis)
**Trigger:** `/review-code` — run manually before any merge or deploy.

---

## GUARD RULE

> **If `@security-expert` raises a CRITICAL finding at any point, the workflow STOPS immediately.**
> No subsequent steps execute. `@engineer` must patch and restart the chain from Step 1.

---

## Step 1 — @engineer: Feature Presentation

**Goal:** Give all reviewers a precise, unambiguous picture of what changed and why.

**Reads:** [`skills/otto_architecture.md`](../skills/otto_architecture.md)

### Actions

1. **Scope the diff** — list every file changed:
   ```bash
   git diff --name-only main
   ```
2. **State the intent** — answer in ≤ 5 bullet points:
   - What problem does this solve?
   - What files/modules were touched?
   - What is the happy-path data flow for this change?
   - Are there new DB tables, columns, or RPCs?
   - Are there new API routes or Server Actions?
3. **Reference architecture** — map the change to the component diagram in `skills/otto_architecture.md` (Knowledge Graph, RAG pipeline, Server Actions, etc.).
4. **Flag known risks** — list anything you were uncertain about during implementation.

### Output
- A concise "Change Brief" (≤ 200 words) handed to `@security-expert`.

---

## Step 2 — @security-expert: Hostile Review

**Goal:** Actively attack the new code. Assume every input is malicious.

**Reads:** [`skills/cybersecurity_hardening.md`](../skills/cybersecurity_hardening.md)

### Checklist

| Check | Target | Pass Condition |
|---|---|---|
| Auth on every new route/action | `app/api/**/route.ts`, `app/actions/*.ts` | `supabase.auth.getUser()` is the **first** call |
| IDOR — ownership enforcement | Any DB read/write | `.eq("user_id", user.id)` present, no body-trusted IDs |
| RLS bypass via RPC | New `supabase.rpc()` calls | Verify matching RLS policy in migration |
| SQL injection | Any string touching DB | No `${...}` interpolation — SDK calls only |
| XSS surface | New rendered output | `dangerouslySetInnerHTML` preceded by `DOMPurify.sanitize()` |
| `process.env` leaks | New Client Components | Only `NEXT_PUBLIC_*` vars used client-side |
| Payload limits | New POST routes | Max 4 KB enforced |
| Rate limiting | AI-invoking endpoints | Rate limiter middleware attached |
| Prompt injection | New system-prompt constructions | User input never concatenated into system role |

### Severity Scale
- **CRITICAL** — Data exfiltration, auth bypass, RCE possible. **→ STOP WORKFLOW.**
- **HIGH** — IDOR, RLS mismatch, unprotected AI endpoint. Blocks merge.
- **MEDIUM** — Missing rate limit, oversized payload, partial auth. Must fix before release.
- **LOW** — Minor hygiene issues. Track in backlog.

### Output
- Findings table with severity, file:line, and reproduction steps.
- Explicit **GO** (no blockers) or **NO-GO** (CRITICAL/HIGH found).

> **If NO-GO with CRITICAL: halt immediately. Notify `@engineer` to patch and restart from Step 1.**

---

## Step 3 — @tutor: Domain Integrity Review

**Goal:** Ensure the change does not corrupt the pedagogical contract with the student.

**Reads:** [`skills/enem_domain_rules.md`](../skills/enem_domain_rules.md)

### Checklist

1. **System prompt integrity** — if `lib/prompts/otto-system.ts` was touched:
   - Does Otto still address students in Brazilian Portuguese (pt-BR)?
   - Are the ENEM subject context blocks (Linguagens, Humanas, Natureza, Matemática, Redação) intact?
   - Is exam feedback still capped at ≤ 200 words and pedagogically sound?
2. **Exam/Flashcard generation** — if `/api/exams/generate` or `/api/flashcards/generate` changed:
   - Does output still conform to ENEM cognitive levels (Conhecimento, Compreensão, Análise, Síntese)?
   - Are the 5 distractor options still structurally plausible?
   - Is the `enem_questions` embedding pipeline unaffected?
3. **RAG pipeline** — if `match_enem_questions` or vector search changed:
   - Is the similarity threshold preserved?
   - Is content retrieved still scoped to the student's subject area?
4. **No English leakage** — scan any new AI-facing string literals:
   ```bash
   grep -rn "\"[A-Z]" lib/prompts/ app/api/exams/ app/api/flashcards/ --include="*.ts"
   ```

### Output
- **PASS** / **FAIL** per checklist item.
- For any FAIL: exact file, line, and suggested fix.
- Overall **Domain Integrity: PASS** or **Domain Integrity: FAIL**.

---

## Step 4 — @qa: Vibe & Polish Review

**Goal:** Ensure the UI is polished, accessible, mobile-first, and consistent with the design system.

**Reads:** [`skills/coding_standards.md`](../skills/coding_standards.md)

### Checklist

1. **Component library** — new UI uses Shadcn/ui primitives, not hand-rolled equivalents.
2. **Animations** — interactive elements use Framer Motion (`motion.*`), not raw CSS transitions for complex state.
3. **Mobile-first** — layout uses responsive Tailwind breakpoints (`sm:`, `md:`, `lg:`); no pixel-fixed widths.
4. **Dark mode** — all new colors use CSS semantic variables (e.g. `text-foreground`, `bg-background`), not hardcoded hex/Tailwind color names.
5. **Typography** — text uses the project's type scale; no ad-hoc `text-[17px]` arbitrary values.
6. **Loading & error states** — async operations show skeletons or spinners; errors display user-facing messages (not raw error objects).
7. **Accessibility** — interactive elements have `aria-label` or visible labels; focus ring is visible.
8. **No console noise** — `console.log` / `console.error` not committed in new client components.
   ```bash
   grep -rn "console\." app/components/ app/app/ --include="*.tsx" | grep -v "// ok"
   ```

### Output
- **PASS** / **NEEDS WORK** per checklist item.
- Screenshot or component path for any visual issue.
- Overall **Vibe & Polish: PASS** or **Vibe & Polish: NEEDS WORK**.

---

## Step 5 — @engineer: Synthesis & Go/No-Go

**Goal:** Consolidate all feedback into a single, actionable remediation plan and get a final decision from `@security-expert`.

### Actions

1. **Aggregate feedback** — collect outputs from Steps 2, 3, and 4 into a single table:

   | # | Agent | Severity | Finding | File:Line | Status |
   |---|---|---|---|---|---|
   | 1 | @security-expert | HIGH | ... | `app/api/...` | Open |
   | 2 | @tutor | FAIL | ... | `lib/prompts/...` | Open |
   | 3 | @qa | NEEDS WORK | ... | `app/components/...` | Open |

2. **Propose consolidated fix** — for each open item, state the exact change needed (file, line, proposed patch).
3. **Request @security-expert Go/No-Go**:
   - Present the remediation plan.
   - Ask: *"Are the security findings addressed to a GO standard?"*

### @security-expert Final Decision

- **GO** — all CRITICAL/HIGH findings resolved. Merge is approved. MEDIUM/LOW tracked in backlog.
- **NO-GO** — findings are unresolved or the fix introduces new risk. Restart from Step 1 after patching.

### Output
- Final aggregated table with statuses updated to **Resolved** or **Deferred**.
- Explicit `MERGE APPROVED` or `MERGE BLOCKED` verdict.

---

## Running the Review

```
/review-code
```

1. Trigger must be run on a feature branch, not `main`.
2. Steps execute **sequentially** — no agent skips their turn.
3. A CRITICAL finding from `@security-expert` (Steps 2 or 5) halts the chain immediately.
4. Document the final output in `reports/review-YYYY-MM-DD-<branch>.md`.
5. Link the report in the PR description before requesting merge.
