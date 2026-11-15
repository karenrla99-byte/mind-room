-- 마음방 6단계: 기록방 (선생님만 보는 감정 기록 전체)
-- 전시방용 get_works 는 최근 1000개까지만 주지만, 기록방은 기간을 정해 모두 받음
create function public.teacher_get_records(
  p_room_id uuid, p_teacher_key text, p_from timestamptz default null, p_to timestamptz default null
) returns jsonb
language plpgsql security definer stable
set search_path = ''
as $$
declare
  r public.rooms := app_private.room_for_teacher(p_room_id, p_teacher_key);
begin
  return (
    select coalesce(jsonb_agg(app_private.work_json(w) order by w.created_at), '[]'::jsonb)
    from (
      select * from public.works
      where room_id = r.id
        and (p_from is null or created_at >= p_from)
        and (p_to is null or created_at < p_to)
      order by created_at desc
      limit 20000
    ) w
  );
end $$;

revoke all on function public.teacher_get_records(uuid, text, timestamptz, timestamptz) from public;
grant execute on function public.teacher_get_records(uuid, text, timestamptz, timestamptz) to anon, authenticated;
