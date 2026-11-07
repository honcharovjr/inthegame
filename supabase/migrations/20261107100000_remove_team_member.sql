-- The owner removes a member from a team (FR-27). Goes through a function, as
-- joining and leaving do, so clients never delete member rows themselves.
-- The member's past sessions stay in the team's history.

create function public.remove_team_member(p_team_id uuid, p_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile uuid := public.current_profile_id();
begin
  if not exists (
    select 1 from public.teams where id = p_team_id and owner_id = v_profile
  ) then
    raise exception 'Only the owner can remove members';
  end if;
  if p_profile_id = v_profile then
    raise exception 'The owner cannot remove themselves';
  end if;
  delete from public.team_members
  where team_id = p_team_id and profile_id = p_profile_id and role <> 'owner';
  if not found then
    raise exception 'Not a member of this team';
  end if;
end;
$$;

revoke execute on function public.remove_team_member(uuid, uuid) from public, anon;
grant execute on function public.remove_team_member(uuid, uuid) to authenticated;
