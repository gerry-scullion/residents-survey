create type public.app_role as enum ('admin');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "Users read own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

drop policy "Signed in users can read contacts" on public.contacts;
create policy "Admins can read contacts" on public.contacts for select to authenticated using (public.has_role(auth.uid(), 'admin'));
drop policy "Anyone can submit a contact" on public.contacts;
create policy "Anyone can submit a valid contact" on public.contacts for insert to anon, authenticated
with check (email is not null and length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$');

drop policy "Signed in users can read responses" on public.responses;
create policy "Admins can read responses" on public.responses for select to authenticated using (public.has_role(auth.uid(), 'admin'));
drop policy "Anyone can submit a response" on public.responses;
create policy "Anyone can submit a valid response" on public.responses for insert to anon, authenticated
with check (
  coalesce(length(what_is_good),0) <= 5000 and coalesce(length(one_change),0) <= 5000
  and coalesce(length(anything_else),0) <= 5000 and coalesce(length(why_not_used),0) <= 5000
  and coalesce(length(fixing_location),0) <= 1000 and coalesce(length(looks_after_detail),0) <= 1000
  and coalesce(length(road),0) <= 200 and coalesce(length(tenure),0) <= 200
  and coalesce(length(age_band),0) <= 200 and coalesce(length(has_dog),0) <= 200
  and coalesce(length(looks_after),0) <= 200
);