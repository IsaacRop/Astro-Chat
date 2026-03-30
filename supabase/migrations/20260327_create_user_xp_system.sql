-- ============================================================
-- XP System: user_xp table + add_xp RPC
-- ============================================================

-- 1. Table --------------------------------------------------
create table if not exists public.user_xp (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  xp_total     bigint  not null default 0,
  nivel_global integer not null default 1,
  xp_por_area  jsonb   not null default '{}'::jsonb,
  nivel_por_area jsonb not null default '{}'::jsonb,
  streak_atual   integer not null default 0,
  streak_maximo  integer not null default 0,
  last_activity  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint user_xp_user_unique unique (user_id)
);

-- 2. RLS ----------------------------------------------------
alter table public.user_xp enable row level security;

create policy "Users can read own XP"
  on public.user_xp for select
  using (auth.uid() = user_id);

create policy "Users can insert own XP"
  on public.user_xp for insert
  with check (auth.uid() = user_id);

create policy "Users can update own XP"
  on public.user_xp for update
  using (auth.uid() = user_id);

-- 3. Indexes ------------------------------------------------
create index if not exists idx_user_xp_user_id on public.user_xp(user_id);

-- 4. Level thresholds (matches lib/xp/constants.ts NIVEIS) --
create or replace function public.calc_nivel(p_xp bigint)
returns integer language plpgsql immutable as $$
declare
  thresholds int[] := array[0, 175, 386, 657, 989, 1382, 1835, 2347, 2917, 3545];
  i int;
begin
  for i in reverse 10..1 loop
    if p_xp >= thresholds[i] then
      return i;
    end if;
  end loop;
  return 1;
end;
$$;

-- 5. add_xp RPC ---------------------------------------------
create or replace function public.add_xp(
  p_user_id   uuid,
  p_source    text,
  p_amount    integer,
  p_area_slug text default null,
  p_metadata  text default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_row       public.user_xp%rowtype;
  v_old_nivel integer;
  v_new_nivel integer;
  v_area_xp   jsonb;
  v_area_nivel jsonb;
  v_area_xp_val bigint;
begin
  -- *** SECURITY CHECK: caller must own the record ***
  if p_user_id != auth.uid() then
    raise exception 'forbidden: cannot add XP to another user';
  end if;

  -- Upsert user_xp row
  insert into public.user_xp (user_id, xp_total, nivel_global, xp_por_area, nivel_por_area, last_activity, updated_at)
  values (p_user_id, p_amount, 1, '{}'::jsonb, '{}'::jsonb, now(), now())
  on conflict (user_id) do update set
    xp_total      = public.user_xp.xp_total + p_amount,
    last_activity  = now(),
    updated_at     = now()
  returning * into v_row;

  -- Update area XP if area provided
  v_area_xp   := v_row.xp_por_area;
  v_area_nivel := v_row.nivel_por_area;

  if p_area_slug is not null and p_area_slug != '' then
    v_area_xp_val := coalesce((v_area_xp ->> p_area_slug)::bigint, 0) + p_amount;
    v_area_xp   := jsonb_set(v_area_xp, array[p_area_slug], to_jsonb(v_area_xp_val));
    v_area_nivel := jsonb_set(v_area_nivel, array[p_area_slug], to_jsonb(public.calc_nivel(v_area_xp_val)));
  end if;

  -- Calculate new global level
  v_old_nivel := v_row.nivel_global;
  v_new_nivel := public.calc_nivel(v_row.xp_total);

  -- Persist area + level updates
  update public.user_xp set
    nivel_global   = v_new_nivel,
    xp_por_area    = v_area_xp,
    nivel_por_area = v_area_nivel
  where user_id = p_user_id;

  -- Update streak (simple daily logic)
  if v_row.last_activity is null
     or v_row.last_activity::date < now()::date then
    update public.user_xp set
      streak_atual  = case
        when v_row.last_activity::date = (now()::date - interval '1 day')::date
        then v_row.streak_atual + 1
        else 1
      end,
      streak_maximo = greatest(
        v_row.streak_maximo,
        case
          when v_row.last_activity::date = (now()::date - interval '1 day')::date
          then v_row.streak_atual + 1
          else 1
        end
      )
    where user_id = p_user_id;
  end if;

  -- Re-fetch final state
  select * into v_row from public.user_xp where user_id = p_user_id;

  return jsonb_build_object(
    'xp_total',         v_row.xp_total,
    'nivel_global',     v_row.nivel_global,
    'nivel_anterior',   v_old_nivel,
    'subiu_nivel',      v_row.nivel_global > v_old_nivel,
    'xp_por_area',      v_row.xp_por_area,
    'nivel_por_area',   v_row.nivel_por_area,
    'streak_atual',     v_row.streak_atual,
    'conquistas_novas', '[]'::jsonb
  );
end;
$$;

-- 6. Realtime -----------------------------------------------
alter publication supabase_realtime add table public.user_xp;
