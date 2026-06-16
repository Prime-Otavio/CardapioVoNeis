create extension if not exists pgcrypto;

create table public.app_settings (
  id int primary key default 1,
  pin_hash text,
  updated_at timestamptz not null default now(),
  constraint single_row check (id = 1)
);

insert into public.app_settings (id, pin_hash) values (1, null) on conflict (id) do nothing;

alter table public.app_settings enable row level security;
create policy "settings sem leitura direta" on public.app_settings for select to authenticated using (false);

create or replace function public.set_owner_pin(p_pin text)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  update public.app_settings
    set pin_hash = crypt(p_pin, gen_salt('bf')), updated_at = now() where id = 1;
end; $$;

create or replace function public.verify_owner_pin(p_pin text)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
declare v_hash text;
begin
  select pin_hash into v_hash from public.app_settings where id = 1;
  if v_hash is null then return false; end if;
  return v_hash = crypt(p_pin, v_hash);
end; $$;

create or replace function public.owner_pin_is_set()
returns boolean language sql security definer set search_path = public as $$
  select pin_hash is not null from public.app_settings where id = 1;
$$;

-- PIN inicial (trocável depois pela tela de configurações)
-- select public.set_owner_pin('SEU_PIN');
