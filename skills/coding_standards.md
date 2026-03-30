---
name: coding_standards
description: Style guidelines, naming conventions, and UI rules for the Astro-Chat codebase. Used by @engineer agents.
---

# Coding Standards

## Language

- **All UI text and AI prompts must be in Brazilian Portuguese (pt-BR).**
- Variable names, function names, and code comments may be in English.

## Framework & Styling Rules

- **Framework:** Next.js 16 App Router
- **CSS:** Tailwind CSS v4 via PostCSS plugin — **no `tailwind.config.js`**. All customization goes through CSS variables in `globals.css`.
- **Component library:** shadcn/ui-style components using `class-variance-authority` + `clsx` + `tailwind-merge` in `components/ui/`
- **Animations:** Framer Motion only — do not swap libraries
- **Icons:** Lucide React only — do not swap libraries
- **Toasts:** Sonner (`<Toaster>` in root layout)

## Fonts (Never Replace)

| Variable | Font | Usage |
|----------|------|-------|
| `--font-sans` | Inter | Body text, UI |
| `--font-serif` | Playfair Display | Headings, accent text |

## Design System (Redesign V2)

### Absolute Rules

- **NEVER change logic, server actions, APIs, routes, or state.** Visual/CSS only for design changes.
- Keep existing fonts, shadcn/ui, Framer Motion, and Lucide React.
- All 7 features must remain functional.

### Color Palette (CSS Variables in `globals.css`)

```css
--color-bg: #F5F9F6;
--color-surface: #FFFFFF;
--color-surface-alt: #EDF4EF;
--color-sidebar: #1E2E25;
--color-sidebar-hover: #2A3E32;
--color-sidebar-text: #D0E0D6;
--color-sidebar-muted: #6B8574;
--color-accent: #4A9E6B;
--color-accent-dark: #3B8558;
--color-accent-light: #DFF0E5;
--color-text: #1E2E25;
--color-text-sec: #5A7565;
--color-text-muted: #8BA698;
--color-border: #D0E0D6;
--color-border-light: #E2EDE6;
```

### Feature Colors

| Feature | Primary | Background |
|---------|---------|------------|
| Chat | `#4A9E6B` | `#DFF0E5` |
| Cadernos | `#5B9E9E` | `#DFF0F0` |
| Notas | `#6BBF8A` | `#E3F5EB` |
| Ideias | `#9B82B8` | `#EDE3F5` |
| Favoritos | `#B89E6B` | `#F2ECD8` |
| Tarefas | `#C17D8A` | `#F5E3E7` |
| Calendário | `#6B9CC6` | `#E0EBF5` |

### Spacing & Border Radius

| Element | Class | Value |
|---------|-------|-------|
| Cards | `rounded-2xl` | 18px |
| Inputs | `rounded-xl` | 14px |
| Buttons | `rounded-lg` | 10px |
| Transitions | `duration-150` to `duration-250 ease` | — |

### Layout

- **Slim sidebar:** 68px wide — logo, search, notifications, help, settings, profile avatar only
- **Horizontal taskbar:** tab navigation for Chat, Cadernos, Notas, Ideias, Favoritos, Tarefas, Calendário
- **Main area:** active tab content

## Responsiveness Rules

- **Mobile first:** default styles target 320px–480px
- **Breakpoints:** `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px)
- Sidebar: hidden on mobile, toggled via hamburger menu
- Top taskbar: scrollable horizontally on mobile, or collapsed into hamburger
- Cards grid: 1 column (mobile), 2 (sm/md), 3 (lg+)
- Font sizes: reduce headings by 1 step on mobile (`text-2xl` → `text-xl`)
- Padding: `p-4` (mobile), `p-6` (md), `p-8` (lg+)
- **Touch targets:** minimum 44×44px for all interactive elements
- Test targets: iPhone SE (375px), iPhone 14 (390px), Android mid-range (360px), iPad (768px)

## Supabase Client Conventions

- `utils/supabase/server.ts` — for Server Components, server actions, route handlers
- `utils/supabase/client.ts` — for Client Components
- Both files must throw a descriptive error if env vars are missing. **Do NOT use `!` assertions.**

## Security / Ownership Checks

- All delete operations must perform `.eq("user_id", user.id)` **before** deleting any child records.
- Server actions must independently call `supabase.auth.getUser()` — never rely on client-side auth context.
- **Never remove `supabase.auth.getUser()` from `middleware.ts`** — it keeps server-side sessions alive.

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| React components | PascalCase | `ChatInterface`, `NodeSlideOver` |
| Server actions | camelCase verbs | `getChatMessages`, `createNewChat` |
| API routes | kebab-case dirs | `/api/chat/save`, `/api/exams/generate` |
| Supabase table names | snake_case | `exam_questions`, `flashcard_decks` |
| CSS variables | `--color-*` prefix | `--color-accent`, `--color-border` |
| localStorage keys | `teo-*` prefix | `teo-caderno-note-{chatId}` |
