-- 마음방 2단계: 방 · 명단 · 작품 표와 방 관리 함수
-- 원칙: 표는 RLS로 모두 막고, 읽기·쓰기는 security definer 함수로만 한다 (로그인 없음).

-- ───────── 표 ─────────
create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[0-9]{6}$'),
  name text not null check (char_length(name) between 1 and 40),
  pin_hash text not null,
  teacher_key_hash text not null,
  is_open boolean not null default true,
  settings jsonb not null default '{}'::jsonb,
  pin_fail_count int not null default 0,
  pin_locked_until timestamptz,
  created_at timestamptz not null default now()
);

-- PIN으로 권한을 되찾은 다른 기기의 열쇠 (원래 열쇠는 rooms.teacher_key_hash)
create table public.room_teacher_keys (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  key_hash text not null,
  created_at timestamptz not null default now()
);
create index room_teacher_keys_room_idx on public.room_teacher_keys (room_id);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 20),
  "order" int not null default 0,
  image_path text,
  created_at timestamptz not null default now()
);
create index students_room_idx on public.students (room_id, "order");

create table public.works (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  student_id uuid references public.students (id) on delete cascade,
  activity text not null,
  group_key text,
  word text,
  intensity smallint check (intensity between 1 and 5),
  reason text,
  image_path text,
  created_at timestamptz not null default now()
);
create index works_room_idx on public.works (room_id, created_at desc);
create index works_student_idx on public.works (student_id);

alter table public.rooms enable row level security;
alter table public.room_teacher_keys enable row level security;
alter table public.students enable row level security;
alter table public.works enable row level security;

revoke all on public.rooms, public.room_teacher_keys, public.students, public.works from anon, authenticated;

-- ───────── 안에서만 쓰는 함수 ─────────
create schema if not exists app_private;
revoke all on schema app_private from public, anon, authenticated;

create function app_private.hash_key(p_key text) returns text
language sql immutable
set search_path = ''
as $$ select encode(extensions.digest(p_key, 'sha256'), 'hex') $$;

-- 교사 열쇠가 맞으면 방을 돌려주고, 아니면 오류
create function app_private.room_for_teacher(p_room_id uuid, p_teacher_key text) returns public.rooms
language plpgsql stable
set search_path = ''
as $$
declare
  r public.rooms;
  h text := app_private.hash_key(coalesce(p_teacher_key, ''));
begin
  select * into r from public.rooms where id = p_room_id;
  if r.id is null then
    raise exception 'ROOM_NOT_FOUND';
  end if;
  if r.teacher_key_hash = h
     or exists (select 1 from public.room_teacher_keys k where k.room_id = r.id and k.key_hash = h) then
    return r;
  end if;
  raise exception 'NOT_TEACHER';
end $$;

-- PIN 확인. 5번 틀리면 5분 동안 잠금. 결과: 'ok' | 'wrong' | 'locked'
create function app_private.check_pin(p_room_id uuid, p_pin text) returns text
language plpgsql
set search_path = ''
as $$
declare
  r public.rooms;
begin
  select * into r from public.rooms where id = p_room_id for update;
  if r.pin_locked_until is not null and r.pin_locked_until > now() then
    return 'locked';
  end if;
  if r.pin_hash = extensions.crypt(coalesce(p_pin, ''), r.pin_hash) then
    update public.rooms set pin_fail_count = 0, pin_locked_until = null where id = r.id;
    return 'ok';
  end if;
  update public.rooms
     set pin_fail_count = case when pin_fail_count + 1 >= 5 then 0 else pin_fail_count + 1 end,
         pin_locked_until = case when pin_fail_count + 1 >= 5 then now() + interval '5 minutes' else null end
   where id = r.id;
  return 'wrong';
end $$;

create function app_private.students_json(p_room_id uuid) returns jsonb
language sql stable
set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', s.id, 'name', s.name, 'image_path', s.image_path)
                            order by s."order", s.created_at, s.id), '[]'::jsonb)
  from public.students s where s.room_id = p_room_id
$$;

create function app_private.room_json(r public.rooms) returns jsonb
language sql stable
set search_path = ''
as $$
  select jsonb_build_object(
    'id', r.id, 'code', r.code, 'name', r.name, 'is_open', r.is_open,
    'settings', r.settings, 'created_at', r.created_at,
    'students', app_private.students_json(r.id))
$$;

-- ───────── 교사용 함수 ─────────
create function public.create_room(p_name text, p_pin text) returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_code text;
  v_key text := encode(extensions.gen_random_bytes(24), 'hex');
  r public.rooms;
begin
  if p_pin is null or p_pin !~ '^[0-9]{4}$' then
    raise exception 'BAD_PIN';
  end if;
  if p_name is null or char_length(btrim(p_name)) not between 1 and 40 then
    raise exception 'BAD_NAME';
  end if;
  loop
    v_code := lpad((floor(random() * 1000000))::int::text, 6, '0');
    exit when not exists (select 1 from public.rooms where code = v_code);
  end loop;
  insert into public.rooms (code, name, pin_hash, teacher_key_hash)
  values (v_code, btrim(p_name), extensions.crypt(p_pin, extensions.gen_salt('bf', 8)), app_private.hash_key(v_key))
  returning * into r;
  return app_private.room_json(r) || jsonb_build_object('teacher_key', v_key);
end $$;

create function public.teacher_get_room(p_room_id uuid, p_teacher_key text) returns jsonb
language plpgsql security definer stable
set search_path = ''
as $$
begin
  return app_private.room_json(app_private.room_for_teacher(p_room_id, p_teacher_key));
end $$;

-- 방 코드 + PIN으로 교사 권한 되찾기 (이 기기용 새 열쇠 발급)
create function public.claim_room(p_code text, p_pin text) returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  r public.rooms;
  v_result text;
  v_key text := encode(extensions.gen_random_bytes(24), 'hex');
begin
  select * into r from public.rooms where code = p_code;
  if r.id is null then
    return jsonb_build_object('error', 'wrong');
  end if;
  v_result := app_private.check_pin(r.id, p_pin);
  if v_result <> 'ok' then
    return jsonb_build_object('error', v_result);
  end if;
  insert into public.room_teacher_keys (room_id, key_hash) values (r.id, app_private.hash_key(v_key));
  return app_private.room_json(r) || jsonb_build_object('teacher_key', v_key);
end $$;

create function public.update_room(p_room_id uuid, p_teacher_key text, p_name text default null, p_is_open boolean default null)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  r public.rooms := app_private.room_for_teacher(p_room_id, p_teacher_key);
begin
  if p_name is not null and char_length(btrim(p_name)) not between 1 and 40 then
    raise exception 'BAD_NAME';
  end if;
  update public.rooms
     set name = coalesce(btrim(p_name), name), is_open = coalesce(p_is_open, is_open)
   where id = r.id
  returning * into r;
  return app_private.room_json(r);
end $$;

-- 방 지우기: PIN을 한 번 더 확인. 명단·작품 기록도 함께 지워짐. 결과: 'ok' | 'wrong' | 'locked'
create function public.delete_room(p_room_id uuid, p_teacher_key text, p_pin text) returns text
language plpgsql security definer
set search_path = ''
as $$
declare
  r public.rooms := app_private.room_for_teacher(p_room_id, p_teacher_key);
  v_result text := app_private.check_pin(r.id, p_pin);
begin
  if v_result = 'ok' then
    delete from public.rooms where id = r.id;
  end if;
  return v_result;
end $$;

create function public.add_students(p_room_id uuid, p_teacher_key text, p_names text[]) returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  r public.rooms := app_private.room_for_teacher(p_room_id, p_teacher_key);
  v_start int;
  v_count int;
begin
  select coalesce(max("order"), 0), count(*) into v_start, v_count from public.students where room_id = r.id;
  if v_count + coalesce(array_length(p_names, 1), 0) > 60 then
    raise exception 'TOO_MANY_STUDENTS';
  end if;
  insert into public.students (room_id, name, "order")
  select r.id, left(btrim(t.name), 20), v_start + t.i
  from unnest(p_names) with ordinality as t(name, i)
  where btrim(t.name) <> '';
  return app_private.students_json(r.id);
end $$;

create function public.rename_student(p_room_id uuid, p_teacher_key text, p_student_id uuid, p_name text) returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  r public.rooms := app_private.room_for_teacher(p_room_id, p_teacher_key);
begin
  if p_name is null or char_length(btrim(p_name)) not between 1 and 20 then
    raise exception 'BAD_NAME';
  end if;
  update public.students set name = btrim(p_name) where id = p_student_id and room_id = r.id;
  return app_private.students_json(r.id);
end $$;

create function public.delete_student(p_room_id uuid, p_teacher_key text, p_student_id uuid) returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  r public.rooms := app_private.room_for_teacher(p_room_id, p_teacher_key);
begin
  delete from public.students where id = p_student_id and room_id = r.id;
  return app_private.students_json(r.id);
end $$;

-- 순서 바꾸기: 새 순서대로 학생 id를 모두 보냄
create function public.reorder_students(p_room_id uuid, p_teacher_key text, p_ids uuid[]) returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  r public.rooms := app_private.room_for_teacher(p_room_id, p_teacher_key);
begin
  update public.students s set "order" = t.i
  from unnest(p_ids) with ordinality as t(id, i)
  where s.id = t.id and s.room_id = r.id;
  return app_private.students_json(r.id);
end $$;

-- ───────── 학생용 함수 ─────────
-- 방 코드로 방 이름·열림 여부·명단·설정 받기. 없는 코드면 null
create function public.get_room_by_code(p_code text) returns jsonb
language sql security definer stable
set search_path = ''
as $$
  select jsonb_build_object(
    'id', r.id, 'code', r.code, 'name', r.name, 'is_open', r.is_open, 'settings', r.settings,
    'students', app_private.students_json(r.id))
  from public.rooms r where r.code = p_code
$$;

-- ───────── 권한 ─────────
revoke all on all functions in schema app_private from public, anon, authenticated;
revoke all on all functions in schema public from public;
grant execute on function
  public.create_room(text, text),
  public.teacher_get_room(uuid, text),
  public.claim_room(text, text),
  public.update_room(uuid, text, text, boolean),
  public.delete_room(uuid, text, text),
  public.add_students(uuid, text, text[]),
  public.rename_student(uuid, text, uuid, text),
  public.delete_student(uuid, text, uuid),
  public.reorder_students(uuid, text, uuid[]),
  public.get_room_by_code(text)
to anon, authenticated;
