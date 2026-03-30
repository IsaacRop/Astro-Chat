# GEMINI.md - Otto (Tutor de ENEM com IA)

Este arquivo serve como o contexto mestre para interações com o Gemini CLI neste projeto. Ele descreve a arquitetura, as convenções de desenvolvimento e os fluxos de trabalho essenciais do Otto.

## 🚀 Visão Geral do Projeto

O **Otto** é um tutor de IA especializado no ENEM (Exame Nacional do Ensino Médio). Diferente de um chatbot genérico, ele utiliza RAG (Retrieval-Augmented Generation) sobre uma base de ~12 mil questões reais do ENEM para guiar alunos com um método socrático.

- **Stack Principal:** Next.js 16 (App Router), TypeScript 5, Tailwind CSS v4, Supabase (PostgreSQL + pgvector).
- **IA:** OpenAI (`gpt-4o-mini` para chat/geração, `text-embedding-3-small` para RAG) via Vercel AI SDK.
- **Idioma:** Todo o conteúdo da UI e saídas de IA **devem ser em Português Brasileiro (pt-BR)**.

---

## 🛠️ Comandos Principais

| Comando | Descrição |
|---------|-----------|
| `pnpm install` | Instala as dependências do projeto. |
| `pnpm dev` | Inicia o servidor de desenvolvimento em `localhost:3000`. |
| `pnpm build` | Gera o build de produção do Next.js. |
| `pnpm lint` | Executa a verificação do ESLint. |
| `supabase db push` | Aplica as migrations ao banco de dados Supabase. |
| `python scripts/ingest_enem.py` | (Opcional) Ingere o dataset de questões do ENEM no Supabase. |

---

## 🏗️ Arquitetura e Estrutura de Pastas

- `app/`: Contém as rotas do Next.js (App Router).
    - `actions/`: Server Actions divididas por domínio (chat, study, exams, usage, xp).
    - `api/`: Route Handlers para endpoints de chat, simulados e flashcards.
- `components/`: Componentes React organizados por funcionalidade (mapa, chat, ui, auth).
- `lib/`: Lógica de backend e utilitários.
    - `prompts/`: Definições de System Prompts dinâmicos (Otto identity + blocos de área).
    - `rag/`: Lógica de recuperação de questões via pgvector (`enem-retriever.ts`).
    - `xp/`: Sistema de gamificação (XP, níveis, ações).
- `supabase/migrations/`: Definições de tabelas, RPCs de pgvector e índices HNSW.
- `skills/`: Documentação de domínio e regras de negócio (ex: `enem_domain_rules.md`).

---

## ⚖️ Convenções de Desenvolvimento

### 1. Segurança e Autenticação
- **Auth Obrigatório:** Todas as Server Actions e API Routes devem validar o usuário via `supabase.auth.getUser()` como primeira operação.
- **Propriedade de Dados:** Sempre filtre queries pelo `user_id` obtido do JWT do Supabase, nunca confie no `user_id` enviado no corpo da requisição.
- **Middleware:** O arquivo `middleware.ts` protege rotas como `/dashboard`, `/chat`, `/provas`, etc.

### 2. Padrões de Código
- **TypeScript Estrito:** Use tipos explícitos. Evite `any` (a menos que seja estritamente necessário em RPCs legadas).
- **Server Actions:** Prefira Server Actions para mutações de dados e interações simples com o banco.
- **Estilização:** Utilize Tailwind CSS v4. Siga os padrões de design de Dark Mode e animações com Framer Motion.
- **Idioma:** Mantenha strings de UI e mensagens de erro em **pt-BR**.

### 3. Fluxo de IA (RAG)
- O pipeline de RAG está centralizado em `lib/rag/enem-retriever.ts`.
- O prompt do sistema é dinâmico e injeta contexto baseado na área detectada (Linguagens, Humanas, Natureza, Matemática, Redação).

---

## 📖 Regras de Domínio (ENEM)

Para detalhes sobre a pedagogia, mapeamento de conhecimento, geração de simulados e regras de flashcards, consulte sempre o arquivo:
👉 `skills/enem_domain_rules.md`

---

## 🚩 Notas Importantes para o Gemini
- **Sempre** verifique `supabase.auth.getUser()` antes de sugerir modificações em Server Actions.
- **Sempre** gere respostas de IA e textos de UI em **Português Brasileiro (pt-BR)**.
- Ao lidar com o banco de dados, utilize o cliente do Supabase (`@supabase/supabase-js`) e respeite as Row Level Security (RLS) definidas nas migrations.
