-- 마음방 3단계: 방 설정(감정 목록·이름표 단계) 저장 함수
create function public.update_room_settings(p_room_id uuid, p_teacher_key text, p_settings jsonb) returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  r public.rooms := app_private.room_for_teacher(p_room_id, p_teacher_key);
begin
  if p_settings is null or jsonb_typeof(p_settings) <> 'object' or pg_column_size(p_settings) > 200000 then
    raise exception 'SETTINGS_TOO_BIG';
  end if;
  update public.rooms set settings = p_settings where id = r.id returning * into r;
  return app_private.room_json(r);
end $$;

revoke all on function public.update_room_settings(uuid, text, jsonb) from public;
grant execute on function public.update_room_settings(uuid, text, jsonb) to anon, authenticated;
