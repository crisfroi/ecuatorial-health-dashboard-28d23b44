import React from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useMemo, useState } from "react";

type FormData = {
  profesionalId?: string;
  searchProfesional?: string;
  idProfesionalUnico?: string;
  motivo: string;
  descripcion?: string;
  fechaIncidente: string; // ISO string
  faltaCodigo?: string;
  gravedad?: 'leve' | 'grave' | 'muy_grave';
  centroSaludId?: string;
  archivos?: FileList;
};

export function ExpedienteNuevoForm() {
  const { toast } = useToast();
  const { register, handleSubmit, formState: { isSubmitting }, reset, setValue, watch } = useForm<FormData>({
    defaultValues: { fechaIncidente: new Date().toISOString().slice(0, 16) }
  });

  const [profResults, setProfResults] = useState<any[]>([]);
  const [faltas, setFaltas] = useState<{ codigo: string; nombre: string }[]>([]);
  const [centros, setCentros] = useState<{ id: string; nombre: string }[]>([]);

  // Cargar catálogos
  useEffect(() => {
    (async () => {
      const { data: f } = await supabase.from('faltas_catalogo').select('codigo,nombre').eq('activo', true).order('nombre');
      setFaltas(f || []);
      const { data: c } = await supabase.from('centros_salud').select('id,nombre').order('nombre');
      setCentros(c || []);
    })();
  }, []);

  // Búsqueda avanzada de profesionales (por nombre, id único, etc.)
  const searchProfesional = watch('searchProfesional');
  useEffect(() => {
    const run = async () => {
      const term = (searchProfesional || '').trim();
      if (!term || term.length < 2) { setProfResults([]); return; }
      const { data } = await supabase
        .from('profesionales_sanitarios')
        .select('id,nombre_completo,id_profesional_unico,area_profesional,nombre_centro')
        .or(`nombre_completo.ilike.%${term}%,id_profesional_unico.ilike.%${term}%`)
        .limit(10);
      setProfResults(data || []);
    };
    run();
  }, [searchProfesional]);

  const onSubmit = async (values: FormData) => {
    try {
      // 1) Resolver profesional
      let profesionalId = values.profesionalId;
      if (!profesionalId && values.idProfesionalUnico) {
        const { data: prof, error: e1 } = await supabase
          .from("profesionales_sanitarios")
          .select("id, id_profesional_unico")
          .eq("id_profesional_unico", values.idProfesionalUnico.trim())
          .single();
        if (e1 || !prof) throw new Error("Profesional no encontrado");
        profesionalId = prof.id;
      }
      if (!profesionalId) throw new Error('Seleccione un profesional');

      // 2) Subir archivos de prueba (múltiples)
      const pruebasUrls: string[] = [];
      const files = Array.from(values.archivos || []);
      for (const file of files) {
        const path = `${profesionalId}/${Date.now()}_${file.name}`;
        const { data: up, error: eUp } = await supabase.storage.from("expedientes").upload(path, file, { upsert: false });
        if (eUp) throw eUp;
        const { data: pub } = supabase.storage.from("expedientes").getPublicUrl(up.path);
        if (pub?.publicUrl) pruebasUrls.push(pub.publicUrl);
      }

      // 3) Llamar a la Edge Function (CORRECCIÓN IMPLEMENTADA AQUÍ)

      const payload = {
        profesionalId,
        motivo: values.motivo,
        archivoAdjuntoUrl: pruebasUrls[0], // Usado para compatibilidad con la estructura anterior
        fechaIncidente: values.fechaIncidente ? new Date(values.fechaIncidente).toISOString() : new Date().toISOString(),
        faltaCodigo: values.faltaCodigo,
        gravedad: values.gravedad,
        descripcion: values.descripcion,
        centroSaludId: values.centroSaludId,
        pruebasUrls // Se envía la lista completa de URLs
      };

      // Usar supabase.functions.invoke() para resolver el error 404 de enrutamiento
      const { data: responseData, error: functionError } = await supabase.functions.invoke('expediente-abrir', {
        body: payload,
      });

      if (functionError) {
        throw new Error(functionError.message || "Error de red al llamar a la función.");
      }

      const json = responseData;

      if (json?.error) {
        // La función Deno devolvió un error lógico (ej. no autenticado, permiso denegado)
        throw new Error(json.error);
      }

      if (!json?.expediente?.id) {
        throw new Error("Respuesta de función incompleta: Expediente ID no encontrado.");
      }

      toast({ title: "Expediente creado", description: `ID: ${json.expediente.id}` });
      reset();
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "No se pudo crear el expediente", variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nuevo Expediente Disciplinario</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-2xl">
          {/* Identificación del Profesional */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Búsqueda de Profesional</label>
              <Input placeholder="Nombre o ID único" {...register('searchProfesional')} />
              {profResults.length > 0 && (
                <div className="mt-2 border rounded max-h-48 overflow-auto bg-white shadow">
                  {profResults.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-accent"
                      onClick={() => { setValue('profesionalId', p.id); setValue('searchProfesional', `${p.nombre_completo} · ${p.id_profesional_unico}`); }}
                    >
                      <div className="text-sm font-medium">{p.nombre_completo}</div>
                      <div className="text-xs text-muted-foreground">{p.id_profesional_unico} · {p.area_profesional} · {p.nombre_centro}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium">ID Profesional Único (alternativo)</label>
              <Input {...register("idProfesionalUnico")} placeholder="GE-123456" />
            </div>
          </div>

          {/* Detalles del Incidente */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Fecha y Hora del Suceso</label>
              <Input type="datetime-local" {...register('fechaIncidente', { required: true })} />
            </div>
            <div>
              <label className="block text-sm font-medium">Motivo Principal</label>
              <Select onValueChange={(v) => setValue('faltaCodigo', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione una falta" />
                </SelectTrigger>
                <SelectContent>
                  {faltas.map(f => (<SelectItem key={f.codigo} value={f.codigo}>{f.nombre}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium">Gravedad</label>
              <Select onValueChange={(v) => setValue('gravedad', v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione gravedad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="leve">Leve</SelectItem>
                  <SelectItem value="grave">Grave</SelectItem>
                  <SelectItem value="muy_grave">Muy Grave</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium">Centro de Salud / Ubicación</label>
              <Select onValueChange={(v) => setValue('centroSaludId', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione centro" />
                </SelectTrigger>
                <SelectContent>
                  {centros.map(c => (<SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Descripción Detallada</label>
            <Textarea {...register("descripcion")} rows={4} placeholder="Resumen del hecho" />
          </div>

          {/* Cargue de Pruebas Iniciales */}
          <div>
            <label className="block text-sm font-medium">Pruebas (documentos/fotos)</label>
            <Input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" {...register('archivos')} />
          </div>

          <div>
            <label className="block text-sm font-medium">Motivo Complementario</label>
            <Textarea {...register("motivo", { required: true })} rows={3} placeholder="Argumento de apertura" />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>Abrir expediente</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}