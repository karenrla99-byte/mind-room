-- 마음방 4단계: 전시방 (작품 올리기·보기·지우기, 저장 공간)

alter table public.works add column group_name text, add column color text;

-- ───────── 저장 공간 ─────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('works', 'works', true, 3145728, array['image/png']),
  ('room-assets', 'room-assets', true, 3145728, array['image/png', 'image/jpeg', 'image/webp']);

-- 작품 파일 경로는 "방id/작품id.png", 열려 있는 방에만 올릴 수 있음
create function public.can_upload_work(p_name text) returns boolean
language sql stable security definer
set search_path = ''
as $$
  select p_name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.png$'
     and exists (select 1 from public.rooms r where r.id::text = split_part(p_name, '/', 1) and r.is_open)
$$;

-- 어떤 작품 기록에도 안 쓰이는 파일 (지운 작품·지운 방의 파일) → 누구나 치울 수 있음
create function public.work_file_orphan(p_name text) returns boolean
language sql stable security definer
set search_path = ''
as $$ select not exists (select 1 from public.works w where w.image_path = p_name) $$;

-- 선생님이 올리는 학생·낱말 그림: "방id/파일이름"
create function public.can_upload_room_asset(p_name text) returns boolean
language sql stable security definer
set search_path = ''
as $$
  select p_name ~ '^[0-9a-f-]{36}/[a-z0-9_-]{1,60}\.(png|jpg|webp)$'
     and exists (select 1 from public.rooms r where r.id::text = split_part(p_name, '/', 1))
$$;

create function public.room_asset_orphan(p_name text) returns boolean
language sql stable security definer
set search_path = ''
as $$ select not exists (select 1 from public.rooms r where r.id::text = split_part(p_name, '/', 1)) $$;

create policy "works: upload to open room" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'works' and public.can_upload_work(name));
create policy "works: see orphan files" on storage.objects for select to anon, authenticated
  using (bucket_id = 'works' and public.work_file_orphan(name));
create policy "works: remove orphan files" on storage.objects for delete to anon, authenticated
  using (bucket_id = 'works' and public.work_file_orphan(name));

create policy "room-assets: upload to existing room" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'room-assets' and public.can_upload_room_asset(name));
create policy "room-assets: see orphan files" on storage.objects for select to anon, authenticated
  using (bucket_id = 'room-assets' and public.room_asset_orphan(name));
create policy "room-assets: remove orphan files" on storage.objects for delete to anon, authenticated
  using (bucket_id = 'room-assets' and public.room_asset_orphan(name));

-- ───────── 작품 함수 ─────────
create function app_private.work_json(w public.works) returns jsonb
language sql stable
set search_path = ''
as $$
  select jsonb_build_object(
    'id', w.id, 'student_id', w.student_id,
    'student_name', (select s.name from public.students s where s.id = w.student_id),
    'activity', w.activity, 'group_key', w.group_key, 'group_name', w.group_name, 'color', w.color,
    'word', w.word, 'intensity', w.intensity, 'reason', w.reason,
    'image_path', w.image_path, 'created_at', w.created_at)
$$;

-- 학생: 작품 올리기 (그림 파일을 먼저 올린 뒤 부름). 교사 확인 없이 바로 전시방에 나타남
create function public.submit_work(
  p_code text, p_student_id uuid, p_work_id uuid, p_activity text,
  p_group_key text, p_group_name text, p_color text, p_word text, p_intensity int, p_reason text
) returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  r public.rooms;
  w public.works;
begin
  select * into r from public.rooms where code = p_code;
  if r.id is null then raise exception 'ROOM_NOT_FOUND'; end if;
  if not r.is_open then raise exception 'ROOM_CLOSED'; end if;
  if not exists (select 1 from public.students s where s.id = p_student_id and s.room_id = r.id) then
    raise exception 'BAD_STUDENT';
  end if;
  if p_activity is null or p_activity !~ '^[a-z]{1,20}$' then raise exception 'BAD_WORK'; end if;
  if p_color is not null and p_color !~ '^#[0-9A-Fa-f]{6}$' then raise exception 'BAD_WORK'; end if;
  insert into public.works (id, room_id, student_id, activity, group_key, group_name, color, word, intensity, reason, image_path)
  values (p_work_id, r.id, p_student_id, p_activity, left(p_group_key, 40), left(p_group_name, 20), p_color,
          left(p_word, 20), p_intensity, nullif(left(btrim(p_reason), 60), ''),
          r.id::text || '/' || p_work_id::text || '.png')
  returning * into w;
  return app_private.work_json(w);
end $$;

-- 전시방: 방 id를 아는 사람은 작품을 볼 수 있음 (방 id는 방 번호로 들어와야 알 수 있음)
create function public.get_works(p_room_id uuid) returns jsonb
language sql stable security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(app_private.work_json(w) order by w.created_at desc), '[]'::jsonb)
  from (select * from public.works where room_id = p_room_id order by created_at desc limit 1000) w
$$;

-- 선생님: 작품 지우기. 지운 작품의 그림 파일 경로를 돌려줌 (파일은 앱이 이어서 치움)
create function public.delete_works(p_room_id uuid, p_teacher_key text, p_ids uuid[]) returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  r public.rooms := app_private.room_for_teacher(p_room_id, p_teacher_key);
  v_paths jsonb;
begin
  with gone as (
    delete from public.works where room_id = r.id and id = any (p_ids) returning image_path
  )
  select coalesce(jsonb_agg(image_path), '[]'::jsonb) into v_paths from gone;
  return v_paths;
end $$;

-- 선생님: 학생 사진·그림 정하기 (null 이면 지움)
create function public.set_student_image(p_room_id uuid, p_teacher_key text, p_student_id uuid, p_image_path text) returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  r public.rooms := app_private.room_for_teacher(p_room_id, p_teacher_key);
begin
  if p_image_path is not null and split_part(p_image_path, '/', 1) <> r.id::text then
    raise exception 'BAD_WORK';
  end if;
  update public.students set image_path = p_image_path where id = p_student_id and room_id = r.id;
  return app_private.students_json(r.id);
end $$;

revoke all on all functions in schema app_private from public, anon, authenticated;
revoke all on function
  public.can_upload_work(text), public.work_file_orphan(text),
  public.can_upload_room_asset(text), public.room_asset_orphan(text),
  public.submit_work(text, uuid, uuid, text, text, text, text, text, int, text),
  public.get_works(uuid), public.delete_works(uuid, text, uuid[]),
  public.set_student_image(uuid, text, uuid, text)
from public;
grant execute on function
  public.can_upload_work(text), public.work_file_orphan(text),
  public.can_upload_room_asset(text), public.room_asset_orphan(text),
  public.submit_work(text, uuid, uuid, text, text, text, text, text, int, text),
  public.get_works(uuid), public.delete_works(uuid, text, uuid[]),
  public.set_student_image(uuid, text, uuid, text)
to anon, authenticated;
