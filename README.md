
<div align="center">

<img src="public/otto-logo.png" alt="Otto Logo" width="96" height="96" />

# Otto — Tutor de ENEM com IA

**O assistente de estudos inteligente para quem quer passar no ENEM de verdade.**

[![Next.js](https://img.shields.io/badge/Next.js_16-App_Router-black?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_v4-PostCSS-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-pgvector-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-gpt--4o--mini-412991?logo=openai&logoColor=white)](https://openai.com/)
[![Vercel AI SDK](https://img.shields.io/badge/Vercel_AI_SDK-streaming-000?logo=vercel&logoColor=white)](https://sdk.vercel.ai/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[Demo](#) · [Documentação](#-arquitetura) · [Reportar Bug](https://github.com/IsaacRop/Astro-Chat/issues) · [Solicitar Feature](https://github.com/IsaacRop/Astro-Chat/issues)

</div>

---

## O que é o Otto?

O **Otto** é um tutor de IA especializado no ENEM — não um chatbot genérico. Ele conhece a matriz de competências do exame, usa questões **reais** dos últimos 15 anos como base de conhecimento (via RAG com pgvector), gera simulados personalizados, cria flashcards no nível cognitivo do ENEM e acompanha a evolução do aluno com um sistema de XP e mapa de progresso por área.

Toda a interface e todos os prompts de IA estão em **português brasileiro (pt-BR)** — porque o ENEM é nacional.

---

## ✨ Funcionalidades Principais

### 🤖 Otto — Chat com IA Socrática
O coração do produto. Otto não apenas responde — ele guia o aluno com perguntas, analogias e raciocínio passo-a-passo, seguindo o método socrático.

- **Prompts dinâmicos**: o system prompt muda conforme a área detectada na mensagem (Linguagens, Ciências Humanas, Natureza, Matemática ou Redação)
- **RAG sobre o ENEM**: respostas embasadas em ~12 mil questões reais (2009–2024) indexadas com pgvector + HNSW
- **Streaming em tempo real** via Vercel AI SDK (`gpt-4o-mini`)
- **Histórico persistente**: sessões salvas no Supabase com título gerado automaticamente por IA

### 📊 Grafo de Conhecimento (`/cadernos`)
O estudo do aluno se transforma em um grafo visual de tópicos interconectados.

- Após cada resposta da IA, o chat recebe um **label semântico em pt-BR** e um embedding (`text-embedding-3-small`)
- Arestas calculadas via **similaridade de cosseno** (pgvector RPC `get_chat_similarity_edges`)
- Visualização force-directed com `react-force-graph-2d`; nós crescem com o número de mensagens
- Clique em um nó → abre o editor de notas vinculado ao tópico

### 📝 Simulados Personalizados (`/provas`)
Geração de simulados com questões do estilo ENEM — reais quando disponíveis, geradas por IA quando não.

| Parâmetro | Opções |
|-----------|--------|
| Tipo | Múltipla escolha / Verdadeiro-Falso |
| Quantidade | 5, 10, 15, 20, 30 ou 45 questões |
| Área | Linguagens, Humanas, Natureza, Matemática |
| Modo | Questões reais (RAG) ou geração por GPT-4o-mini |

- Navegação questão-a-questão com barra de progresso e indicadores de status
- Feedback pedagógico ao final: máximo 200 palavras, em pt-BR, gerado pelo Otto

### 🃏 Flashcards Inteligentes (`/flashcards`)
Decks de flashcards gerados no nível cognitivo do ENEM, com frente/verso e sistema de "Sei / Não sei".

- Frente: conceito ou questão no estilo ENEM
- Verso: resposta com raciocínio e referência a questões reais
- RAG garante aderência ao conteúdo cobrado no exame

### 🗺️ Mapa de Progresso + Sistema de XP
Gamificação educacional alinhada à grade do ENEM.

- **10 níveis**: de *Calouro* a *Lenda*
- **XP por ação**: chat (+1), flashcard (+2), questão (+10), simulado completo (+50), streaks diários (+5/dia)
- **Mapa hexagonal**: competências desbloqueadas conforme o aluno evolui em cada área
- **Realtime**: XP atualiza em tempo real via Supabase Realtime (Postgres Changes)
- **Level-up modal** com animação de confetti ao subir de nível

### 🔓 Freemium com Paywall
Acesso gratuito com teto por janela de 5 horas rolante:

| Recurso | Gratuito | Pro |
|---------|----------|-----|
| Mensagens de chat | 10 / 5h | Ilimitado |
| Simulados | 3 / 5h | Ilimitado |
| Flashcard decks | 3 / 5h | Ilimitado |
| Mapa de Progresso | ❌ | ✅ |

### 🎨 UI Premium
- Dark mode completo com variáveis semânticas CSS
- Animações via Framer Motion (spring physics, AnimatePresence)
- Mobile-first com breakpoints Tailwind (`sm:`, `md:`, `lg:`)
- Mascote Octopus interativo no landing page
- Componentes Shadcn/ui-style com `class-variance-authority`

---

## 🛠️ Stack Técnica

| Camada | Tecnologia |
|--------|------------|
| **Framework** | [Next.js 16](https://nextjs.org/) — App Router, Server Actions, Route Handlers |
| **Linguagem** | [TypeScript 5](https://www.typescriptlang.org/) estrito |
| **Estilização** | [Tailwind CSS v4](https://tailwindcss.com/) via PostCSS (sem `tailwind.config.js`) |
| **Banco de dados** | [Supabase](https://supabase.com/) — PostgreSQL + pgvector (HNSW) |
| **IA — Chat** | `gpt-4o-mini` via [Vercel AI SDK](https://sdk.vercel.ai/) (`streamText`) |
| **IA — Embeddings** | `text-embedding-3-small` (1536 dim) |
| **Autenticação** | Supabase Auth (interaction-gate — UI sempre visível) |
| **Animações** | [Framer Motion](https://www.framer.com/motion/) |
| **Ícones** | [Lucide React](https://lucide.dev/) |
| **Grafo** | [`react-force-graph-2d`](https://github.com/vasturiano/react-force-graph-2d) |
| **Toasts** | [Sonner](https://sonner.emilkowal.ski/) |
| **Fontes** | Inter (`--font-sans`) + Playfair Display (`--font-serif`) |

---

## 🚀 Como Rodar Localmente

### Pré-requisitos
- Node.js 18+
- pnpm 8+
- Conta no [Supabase](https://supabase.com/) (free tier funciona)
- Chave de API da [OpenAI](https://platform.openai.com/)

### 1. Clone e instale

```bash
git clone https://github.com/IsaacRop/Astro-Chat.git
cd Astro-Chat
pnpm install
```

### 2. Variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
OPENAI_API_KEY=sk-...

NEXT_PUBLIC_SUPABASE_URL=https://<seu-projeto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>   # necessário para deleteAccount()
```

### 3. Aplique as migrations do Supabase

```bash
supabase db push
```

> As migrations em `supabase/migrations/` criam todas as tabelas, funções pgvector e índices HNSW necessários.

### 4. (Opcional) Ingira o dataset ENEM

Para popular o banco com ~12 mil questões reais do ENEM:

```bash
pip install -r scripts/requirements.txt
python scripts/ingest_enem.py
```

Fontes ingeridas:
- `eduagarcia/enem_challenge` — 2009–2017 (~9k questões, texto)
- `maritaca-ai/enem` — 2022–2024 (~3k questões, com imagens)

### 5. Rode o servidor de desenvolvimento

```bash
pnpm dev
```

Acesse [http://localhost:3000](http://localhost:3000).

---

## 🏗️ Arquitetura

```
Astro-Chat/
├── app/
│   ├── api/
│   │   ├── chat/          # POST /api/chat (streaming), /save, /create
│   │   ├── exams/         # /generate, /[examId]/answer, /[examId]/finish
│   │   └── flashcards/    # /generate
│   ├── actions/           # Server Actions por domínio
│   │   ├── chat.ts        # getChatMessages, getUserChats
│   │   ├── study.ts       # knowledge graph, notes CRUD, deleteChat
│   │   ├── exams.ts       # generateExam, submitAnswer, finishExam
│   │   ├── usage.ts       # freemium: getUserUsage, checkCanUse, incrementUsage
│   │   └── productivity.ts# tasks, ideas, bookmarks, calendar
│   ├── mapa/              # /mapa — XP map page
│   └── (dashboard)/       # chat, provas, flashcards, notas, settings…
│
├── components/
│   ├── mapa/              # XPBar, HexGrid, AreaCard, LevelUpModal, MapaTutorial
│   ├── chat-interface.tsx # Core chat UI
│   ├── GraphVisualization.tsx
│   └── NodeSlideOver.tsx
│
├── lib/
│   ├── prompts/
│   │   └── otto-system.ts # BASE_SYSTEM_PROMPT + 5 blocos de contexto por área
│   ├── rag/
│   │   └── enem-retriever.ts # retrieveEnemQuestions() — pgvector RAG
│   └── xp/
│       ├── constants.ts   # NIVEIS, AREAS, XP_SOURCES, tipos TS
│       └── actions.ts     # addXP(), getUserXP() — Server Actions
│
├── hooks/
│   └── useXP.ts           # Supabase Realtime + level-up detection
│
├── utils/supabase/
│   ├── server.ts          # Client para Server Components / Actions / Routes
│   └── client.ts          # Client para Client Components
│
├── supabase/
│   └── migrations/        # DDL: tabelas, RPCs, índices HNSW
│
└── scripts/
    └── ingest_enem.py     # Ingesta de questões ENEM para Supabase
```

### Pipeline de RAG

```
Mensagem do usuário
       │
       ▼
text-embedding-3-small (OpenAI)
       │
       ▼
match_enem_questions() ← pgvector HNSW (cosine similarity)
       │
       ▼
Top-K questões reais do ENEM
       │
       ▼
buildSystemPrompt() + contexto por área
       │
       ▼
gpt-4o-mini → streamText() → resposta do Otto
```

### Prompt Dinâmico por Área

O `buildSystemPrompt()` injeta blocos de contexto conforme palavras-chave detectadas na mensagem:

| Bloco | Detectado quando |
|-------|-----------------|
| `CONTEXT_LINGUAGENS` | Português, Literatura, Língua Estrangeira… |
| `CONTEXT_HUMANAS` | História, Geografia, Filosofia, Sociologia… |
| `CONTEXT_NATUREZA` | Física, Química, Biologia… |
| `CONTEXT_MATEMATICA` | Matemática, Geometria, Cálculo… |
| `CONTEXT_REDACAO` | Redação, Dissertação, Texto Dissertativo… |

---

## 🔒 Segurança

- **Auth obrigatória em todas as Server Actions e API Routes** via `supabase.auth.getUser()` como primeira operação
- **Sem `user_id` de bodies** — o ID do usuário vem sempre do JWT Supabase
- **Ownership checks** em toda operação de leitura/escrita: `.eq("user_id", user.id)`
- **Sem SQL raw** em nenhum path de query — 100% Supabase SDK
- **Freemium gate** com janela rolante de 5h (table `usage_limits`)
- **Middleware** (`middleware.ts`) cobre `/dashboard/*`, `/cadernos/*` e `/api/**`

---

## 📖 Scripts Disponíveis

```bash
pnpm dev        # Dev server em localhost:3000
pnpm build      # Build de produção
pnpm start      # Inicia o servidor de produção
pnpm lint       # ESLint
supabase db push  # Aplica migrations no Supabase
```

---

## 🤝 Contribuindo

Pull Requests são bem-vindos! Para mudanças grandes, abra uma issue primeiro para discussão.

1. Fork o repositório
2. Crie sua branch: `git checkout -b feat/nova-funcionalidade`
3. Commit suas mudanças: `git commit -m 'feat: adiciona nova funcionalidade'`
4. Push para a branch: `git push origin feat/nova-funcionalidade`
5. Abra um Pull Request

> Antes do merge, execute `/review-code` para rodar a cadeia completa de revisão multi-agente.

---

## 📄 Licença

Distribuído sob a licença MIT. Veja [`LICENSE`](LICENSE) para mais informações.

---

<div align="center">

Feito com ☕ e muito ENEM por [IsaacRop](https://github.com/IsaacRop)

</div>
