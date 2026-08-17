alter table public.tesoreria_conceptos add column if not exists clave_solicitud text;
update public.tesoreria_conceptos set clave_solicitud='REGISTRO' where clave_solicitud is null and codigo in ('REG_PROFESIONAL_SANITARIO','REG_ESTABLECIMIENTO_SANITARIO');
update public.tesoreria_conceptos set clave_solicitud='RENOVACION' where clave_solicitud is null and codigo='RENOVACION_LICENCIA_ESTABLECIMIENTO';
alter table public.tesoreria_conceptos alter column clave_solicitud set default 'REGISTRO';
alter table public.tesoreria_conceptos alter column clave_solicitud set not null;
create unique index if not exists ux_tesoreria_conceptos_tipo_clave on public.tesoreria_conceptos(tipo_solicitud, clave_solicitud);

alter table public.notas_ingreso add column if not exists clave_solicitud text;
update public.notas_ingreso n set clave_solicitud=c.clave_solicitud from public.tesoreria_conceptos c where n.concepto_id=c.id and n.clave_solicitud is null;
drop policy if exists "Solo ministerio puede editar parametros de notas de ingreso" on public.notas_ingreso;
revoke update, delete on public.notas_ingreso from authenticated;
revoke update, delete on public.notas_ingreso from anon;

create table if not exists public.notas_ingreso_auditoria (
  id uuid primary key default gen_random_uuid(),
  nota_ingreso_id uuid not null references public.notas_ingreso(id),
  evento text not null default 'GENERACION',
  snapshot jsonb not null,
  hash text not null,
  algoritmo text not null default 'HMAC-SHA256',
  actor_id uuid null,
  created_at timestamptz not null default now(),
  unique(nota_ingreso_id, evento)
);
create index if not exists ix_notas_ingreso_auditoria_nota on public.notas_ingreso_auditoria(nota_ingreso_id);
alter table public.notas_ingreso_auditoria enable row level security;
drop policy if exists "Ministerio puede consultar auditoria de notas" on public.notas_ingreso_auditoria;
create policy "Ministerio puede consultar auditoria de notas" on public.notas_ingreso_auditoria for select to authenticated using (is_ministerial_user() or is_admin_user());
revoke insert, update, delete on public.notas_ingreso_auditoria from authenticated;
revoke insert, update, delete on public.notas_ingreso_auditoria from anon;

create or replace function public.auditar_nota_ingreso_generada()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notas_ingreso_auditoria(nota_ingreso_id,evento,snapshot,hash,algoritmo,actor_id)
  values (
    new.id,'GENERACION',
    jsonb_build_object('id',new.id,'numero_nota',new.numero_nota,'tipo_solicitud',new.tipo_solicitud,'clave_solicitud',new.clave_solicitud,'solicitud_id',new.solicitud_id,'concepto_id',new.concepto_id,'concepto_codigo',new.concepto_codigo,'concepto_descripcion',new.concepto_descripcion,'monto',new.monto,'moneda',new.moneda,'cuenta_tesoreria',new.cuenta_tesoreria,'beneficiario_nombre',new.beneficiario_nombre,'beneficiario_documento',new.beneficiario_documento,'hash',new.hash,'algoritmo',new.algoritmo,'pdf_url',new.pdf_url,'generado_por',new.generado_por,'created_at',new.created_at),
    new.hash,new.algoritmo,new.generado_por
  ) on conflict (nota_ingreso_id,evento) do nothing;
  return new;
end;
$$;
drop trigger if exists trg_auditar_nota_ingreso on public.notas_ingreso;
create trigger trg_auditar_nota_ingreso after insert on public.notas_ingreso for each row execute function public.auditar_nota_ingreso_generada();

alter table public.inspecciones_establecimientos alter column establecimiento_id drop not null;
alter table public.inspecciones_establecimientos add column if not exists centro_salud_id uuid;
alter table public.inspecciones_establecimientos drop constraint if exists inspecciones_establecimientos_centro_salud_id_fkey;
alter table public.inspecciones_establecimientos add constraint inspecciones_establecimientos_centro_salud_id_fkey foreign key (centro_salud_id) references public.centros_salud(id);
create index if not exists ix_inspecciones_centro_salud on public.inspecciones_establecimientos(centro_salud_id);
alter table public.inspecciones_establecimientos drop constraint if exists inspeccion_unico_origen;
alter table public.inspecciones_establecimientos add constraint inspeccion_unico_origen check ((establecimiento_id is not null) <> (centro_salud_id is not null));
