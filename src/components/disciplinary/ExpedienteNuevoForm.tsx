import React from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

type FormData = {
  idProfesionalUnico: string;
  motivo: string;
  archivo?: FileList;
};

export function ExpedienteNuevoForm() {
  const { toast } = useToast();
  const { register, handleSubmit, formState: { isSubmitting }, reset } = useForm<FormData>();

  const onSubmit = async (values: FormData) => {
    try {
      // 1) Resolver profesional por id_profesional_unico
      const { data: prof, error: e1 } = await supabase
        .from("profesionales_sanitarios")
        .select("id, id_profesional_unico")
        .eq("id_profesional_unico", values.idProfesionalUnico.trim())
        .single();
      if (e1 || !prof) throw new Error("Profesional no encontrado");

      // 2) Subir archivo (opcional) al bucket 'expedientes'
      let archivoAdjuntoUrl: string | undefined;
      const file = values.archivo?.[0];
      if (file) {
        const path = `${prof.id}/${Date.now()}_${file.name}`;
        const { data: up, error: eUp } = await supabase.storage.from("expedientes").upload(path, file, { upsert: false });
        if (eUp) throw eUp;
        const { data: pub } = supabase.storage.from("expedientes").getPublicUrl(up.path);
        archivoAdjuntoUrl = pub.publicUrl;
      }

      // 3) Llamar a la Edge Function
      const token = (await supabase.auth.getSession()).data.session?.access_token || "";
      const res = await fetch("/functions/v1/expediente-abrir", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ profesionalId: prof.id, motivo: values.motivo, archivoAdjuntoUrl }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Error creando expediente");

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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-xl">
          <div>
            <label className="block text-sm font-medium">ID Profesional Único</label>
            <Input {...register("idProfesionalUnico", { required: true })} placeholder="GE-123456" />
          </div>
          <div>
            <label className="block text-sm font-medium">Motivo</label>
            <Textarea {...register("motivo", { required: true })} rows={4} placeholder="Describa el motivo" />
          </div>
          <div>
            <label className="block text-sm font-medium">Documento soporte (opcional)</label>
            <Input type="file" accept=".pdf,.jpg,.png" {...register("archivo")} />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>Abrir expediente</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
