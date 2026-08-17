drop policy if exists "Solo panel ministerial edita conceptos de tesoreria" on public.tesoreria_conceptos;
create policy "Solo panel ministerial edita conceptos de tesoreria" on public.tesoreria_conceptos for all to authenticated using (is_ministerial_user() or is_admin_user()) with check (is_ministerial_user() or is_admin_user());
