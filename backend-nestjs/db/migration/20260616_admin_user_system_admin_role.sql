do $$
begin
  if exists (select 1 from pg_type where typname = 'admin_users_role_enum') then
    alter type admin_users_role_enum add value if not exists 'system_admin';
  end if;
end $$;

alter table admin_users
  alter column role set default 'system_admin';

update admin_users
set role = 'super_admin',
    system_permissions = null,
    service_permissions = null
where email = coalesce(nullif(current_setting('app.admin_email', true), ''), 'admin@example.com');
