-- ============================================================
-- Migration: Exams & Flashcards tables
-- Date: 2026-03-19
-- ============================================================

-- ===================
-- PROVAS (Exams)
-- ===================

create table public.exams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  exam_type text not null check (exam_type in ('multiple_choice', 'true_false')),
  topic text not null,
  total_questions int not null,
  correct_answers int default 0,
  score_percentage numeric(5,2) default 0,
  status text default 'in_progress' check (status in ('in_progress', 'completed')),
  ai_feedback text,
  started_at timestamptz default now(),
  completed_at timestamptz,
  created_at timestamptz default now()
);

create table public.exam_questions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  question_number int not null,
  question_type text not null check (question_type in ('multiple_choice', 'true_false')),
  enunciado text not null,
  alternative_a text,
  alternative_b text,
  alternative_c text,
  alternative_d text,
  alternative_e text,
  correct_answer text not null,
  explanation text not null,
  user_answer text,
  is_correct boolean,
  created_at timestamptz default now()
);

-- ===================
-- FLASHCARDS
-- ===================

create table public.flashcard_decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  topic text not null,
  card_count int default 0,
  cards_reviewed int default 0,
  cards_correct int default 0,
  status text default 'active' check (status in ('active', 'completed')),
  ai_feedback text,
  created_at timestamptz default now()
);

create table public.flashcard_cards (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references public.flashcard_decks(id) on delete cascade,
  card_number int not null,
  front text not null,
  back text not null,
  user_knew boolean,
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

-- ===================
-- INDEXES
-- ===================

create index idx_exams_user_id on public.exams(user_id);
create index idx_exam_questions_exam_id on public.exam_questions(exam_id);
create index idx_flashcard_decks_user_id on public.flashcard_decks(user_id);
create index idx_flashcard_cards_deck_id on public.flashcard_cards(deck_id);

-- ===================
-- RLS
-- ===================

alter table public.exams enable row level security;
alter table public.exam_questions enable row level security;
alter table public.flashcard_decks enable row level security;
alter table public.flashcard_cards enable row level security;

-- Exams: users can only access their own
create policy "Users can select own exams"
  on public.exams for select
  using (auth.uid() = user_id);

create policy "Users can insert own exams"
  on public.exams for insert
  with check (auth.uid() = user_id);

create policy "Users can update own exams"
  on public.exams for update
  using (auth.uid() = user_id);

create policy "Users can delete own exams"
  on public.exams for delete
  using (auth.uid() = user_id);

-- Exam questions: access through parent ownership
create policy "Users can select own exam questions"
  on public.exam_questions for select
  using (exists (
    select 1 from public.exams
    where exams.id = exam_questions.exam_id
      and exams.user_id = auth.uid()
  ));

create policy "Users can insert own exam questions"
  on public.exam_questions for insert
  with check (exists (
    select 1 from public.exams
    where exams.id = exam_questions.exam_id
      and exams.user_id = auth.uid()
  ));

create policy "Users can update own exam questions"
  on public.exam_questions for update
  using (exists (
    select 1 from public.exams
    where exams.id = exam_questions.exam_id
      and exams.user_id = auth.uid()
  ));

create policy "Users can delete own exam questions"
  on public.exam_questions for delete
  using (exists (
    select 1 from public.exams
    where exams.id = exam_questions.exam_id
      and exams.user_id = auth.uid()
  ));

-- Flashcard decks: users can only access their own
create policy "Users can select own flashcard decks"
  on public.flashcard_decks for select
  using (auth.uid() = user_id);

create policy "Users can insert own flashcard decks"
  on public.flashcard_decks for insert
  with check (auth.uid() = user_id);

create policy "Users can update own flashcard decks"
  on public.flashcard_decks for update
  using (auth.uid() = user_id);

create policy "Users can delete own flashcard decks"
  on public.flashcard_decks for delete
  using (auth.uid() = user_id);

-- Flashcard cards: access through parent ownership
create policy "Users can select own flashcard cards"
  on public.flashcard_cards for select
  using (exists (
    select 1 from public.flashcard_decks
    where flashcard_decks.id = flashcard_cards.deck_id
      and flashcard_decks.user_id = auth.uid()
  ));

create policy "Users can insert own flashcard cards"
  on public.flashcard_cards for insert
  with check (exists (
    select 1 from public.flashcard_decks
    where flashcard_decks.id = flashcard_cards.deck_id
      and flashcard_decks.user_id = auth.uid()
  ));

create policy "Users can update own flashcard cards"
  on public.flashcard_cards for update
  using (exists (
    select 1 from public.flashcard_decks
    where flashcard_decks.id = flashcard_cards.deck_id
      and flashcard_decks.user_id = auth.uid()
  ));

create policy "Users can delete own flashcard cards"
  on public.flashcard_cards for delete
  using (exists (
    select 1 from public.flashcard_decks
    where flashcard_decks.id = flashcard_cards.deck_id
      and flashcard_decks.user_id = auth.uid()
  ));
