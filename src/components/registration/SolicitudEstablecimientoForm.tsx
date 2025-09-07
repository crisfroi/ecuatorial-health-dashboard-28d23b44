import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, Building2, Camera, X } from "lucide-react";
import { PROVINCIAS_EG } from "@/utils/geo";
import { useDistritosSanitarios } from "@/hooks/useDistritosSanitarios";
import { useSolicitudesEstablecimientos } from "@/hooks/useSolicitudesEstablecimientos";
import { useAuth } from "@/contexts/AuthContext";

const solicitudSchema = z.object({
  nombre_establecimiento: z.string().min(1, "El nombre del establecimiento es requerido"),
  categoria: z.string().min(1, "La categoría es requerida"),
  tipo_servicio: z.string().min(1, "El tipo de servicio es requerido"),
  provincia: z.string().min(1, "La provincia es requerida"),
  distrito_sanitario: z.string().optional(),
  direccion: z.string().min(1, "La dirección es requerida"),
  telefono: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  director_responsable: z.string().min(1, "El director responsable es requerido"),
  numero_camas: z.number().min(0).optional(),
  servicios_ofrecidos: z.array(z.string()).optional(),
  areas_especializadas: z.array(z.string()).optional(),
  equipamiento_medico: z.array(z.string()).optional(),
  observaciones: z.string().optional(),
});

type SolicitudFormData = z.infer<typeof solicitudSchema>;

const SolicitudEstablecimientoForm = () => {
  const [fotosEstablecimiento, setFotosEstablecimiento] = useState<File[]>([]);
  const [documentosAdicionales, setDocumentosAdicionales] = useState<File[]>([]);
  const [serviciosPersonalizados, setServiciosPersonalizados] = useState<string[]>([]);
  const [areasPersonalizadas, setAreasPersonalizadas] = useState<string[]>([]);

  const form = useForm<SolicitudFormData>({
    resolver: zodResolver(solicitudSchema),
    defaultValues: {
      nombre_establecimiento: "",
      categoria: "",
      tipo_servicio: "",
      provincia: "",
      distrito_sanitario: "",
      direccion: "",
      telefono: "",
      email: "",
      director_responsable: "",
      numero_camas: 0,
      servicios_ofrecidos: [],
      areas_especializadas: [],
      equipamiento_medico: [],
      observaciones: "",
    },
  });

  const watchedProvincia = form.watch("provincia");
  const { data: distritosSanitarios = [] } = useDistritosSanitarios(watchedProvincia);
  const { crearSolicitudMutation } = useSolicitudesEstablecimientos();
  const { user } = useAuth();

  const categorias = [
    "HOSPITAL",
    "CLINICA",
    "CENTRO DE SALUD",
    "CONSULTORIO",
    "FARMACIA",
    "LABORATORIO",
  ];

  const serviciosBase = [
    "Consulta Externa",
    "Hospitalización",
    "Urgencias",
    "Quirófano",
    "Maternidad",
    "Pediatría",
    "Laboratorio",
    "Radiología",
    "Farmacia",
    "Rehabilitación",
  ];

  const areasBase = [
    "Medicina Interna",
    "Cirugía General",
    "Ginecología",
    "Pediatría",
    "Traumatología",
    "Cardiología",
    "Oftalmología",
    "Dermatología",
    "Psiquiatría",
    "Odontología",
  ];

  const handleFotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setFotosEstablecimiento(prev => [...prev, ...files]);
  };

  const handleDocumentoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setDocumentosAdicionales(prev => [...prev, ...files]);
  };

  const removerFoto = (index: number) => {
    setFotosEstablecimiento(prev => prev.filter((_, i) => i !== index));
  };

  const removerDocumento = (index: number) => {
    setDocumentosAdicionales(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: SolicitudFormData) => {
    try {
      await crearSolicitudMutation.mutateAsync({
        ...data,
        fotos_establecimiento: user ? fotosEstablecimiento : [],
        documentos_adicionales: user ? documentosAdicionales : [],
        servicios_ofrecidos: [...(data.servicios_ofrecidos || []), ...serviciosPersonalizados],
        areas_especializadas: [...(data.areas_especializadas || []), ...areasPersonalizadas],
      });

      // Limpiar formulario
      form.reset();
      setFotosEstablecimiento([]);
      setDocumentosAdicionales([]);
      setServiciosPersonalizados([]);
      setAreasPersonalizadas([]);
    } catch (error) {
      const { getErrorMessage } = await import("@/utils/errorHandler");
      const message = getErrorMessage(error);
      console.error("Error enviando solicitud:", message, error);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Building2 className="h-6 w-6" />
          <span>Solicitud de Alta de Establecimiento Sanitario</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Información Básica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="nombre_establecimiento"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Nombre del Establecimiento *</FormLabel>
                    <FormControl>
                      <Input placeholder="Hospital Regional de Malabo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoría del Centro *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione la categoría" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categorias.map((categoria, idx) => (
                          <SelectItem key={`${categoria}-${idx}`} value={categoria}>
                            {categoria}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tipo_servicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Servicio *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione el tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Público">Público</SelectItem>
                        <SelectItem value="Privado">Privado</SelectItem>
                        <SelectItem value="Mixto">Mixto</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="director_responsable"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Director/Responsable *</FormLabel>
                    <FormControl>
                      <Input placeholder="Dr. Juan Pérez" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="telefono"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input placeholder="+240XXXXXXXX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="director@hospital.gq" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="numero_camas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Camas</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Ubicación */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="provincia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provincia *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione la provincia" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PROVINCIAS_EG.map((provincia, idx) => (
                          <SelectItem key={`${provincia}-${idx}`} value={provincia}>
                            {provincia}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="distrito_sanitario"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Distrito Sanitario</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione el distrito sanitario" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {distritosSanitarios.map((distrito, idx) => (
                          <SelectItem key={`${distrito.id}-${idx}`} value={distrito.nombre_distrito}>
                            {distrito.nombre_distrito}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="direccion"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Dirección *</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Ingrese la dirección completa del establecimiento" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Servicios */}
            <div>
              <FormLabel>Servicios Ofrecidos</FormLabel>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {serviciosBase.map((servicio) => (
                  <div key={servicio} className="flex items-center space-x-2">
                    <Checkbox
                      id={`servicio-${servicio}`}
                      checked={form.watch("servicios_ofrecidos")?.includes(servicio)}
                      onCheckedChange={(checked) => {
                        const current = form.getValues("servicios_ofrecidos") || [];
                        if (checked) {
                          form.setValue("servicios_ofrecidos", [...current, servicio]);
                        } else {
                          form.setValue("servicios_ofrecidos", current.filter(s => s !== servicio));
                        }
                      }}
                    />
                    <label htmlFor={`servicio-${servicio}`} className="text-sm">
                      {servicio}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Áreas Especializadas */}
            <div>
              <FormLabel>Áreas Especializadas</FormLabel>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {areasBase.map((area) => (
                  <div key={area} className="flex items-center space-x-2">
                    <Checkbox
                      id={`area-${area}`}
                      checked={form.watch("areas_especializadas")?.includes(area)}
                      onCheckedChange={(checked) => {
                        const current = form.getValues("areas_especializadas") || [];
                        if (checked) {
                          form.setValue("areas_especializadas", [...current, area]);
                        } else {
                          form.setValue("areas_especializadas", current.filter(a => a !== area));
                        }
                      }}
                    />
                    <label htmlFor={`area-${area}`} className="text-sm">
                      {area}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Fotos del Establecimiento */}
            <div className="space-y-4">
              <FormLabel>Fotos del Establecimiento</FormLabel>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Camera className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <label htmlFor="fotos-establecimiento" className={user ? "cursor-pointer" : "opacity-50 cursor-not-allowed"}>
                      <Button type="button" variant="outline" asChild disabled={!user}>
                        <span>
                          <Camera className="w-4 h-4 mr-2" />
                          Subir Fotos
                        </span>
                      </Button>
                    </label>
                    <input
                      id="fotos-establecimiento"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFotoUpload}
                      className="hidden"
                      disabled={!user}
                    />
                    <p className="mt-2 text-sm text-gray-600">
                      {user ? "Máximo 5 fotos (JPG, PNG)" : "Inicia sesión para adjuntar fotos (opcional)"}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h5 className="font-medium">Fotos cargadas:</h5>
                  {fotosEstablecimiento.length === 0 ? (
                    <p className="text-gray-500 text-sm">Ninguna foto cargada</p>
                  ) : (
                    fotosEstablecimiento.map((foto, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded">
                        <span className="text-sm truncate">{foto.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removerFoto(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Documentos Adicionales */}
            <div className="space-y-4">
              <FormLabel>Documentos Adicionales</FormLabel>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <label htmlFor="documentos-adicionales" className={user ? "cursor-pointer" : "opacity-50 cursor-not-allowed"}>
                      <Button type="button" variant="outline" asChild disabled={!user}>
                        <span>
                          <Upload className="w-4 h-4 mr-2" />
                          Subir Documentos
                        </span>
                      </Button>
                    </label>
                    <input
                      id="documentos-adicionales"
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleDocumentoUpload}
                      className="hidden"
                      disabled={!user}
                    />
                    <p className="mt-2 text-sm text-gray-600">
                      {user ? "PDF, JPG, PNG (máx. 5MB cada uno)" : "Inicia sesión para adjuntar documentos (opcional)"}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h5 className="font-medium">Documentos cargados:</h5>
                  {documentosAdicionales.length === 0 ? (
                    <p className="text-gray-500 text-sm">Ningún documento cargado</p>
                  ) : (
                    documentosAdicionales.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded">
                        <span className="text-sm truncate">{doc.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removerDocumento(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Observaciones */}
            <FormField
              control={form.control}
              name="observaciones"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observaciones</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Información adicional sobre el establecimiento..."
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Botón de envío */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  setFotosEstablecimiento([]);
                  setDocumentosAdicionales([]);
                }}
              >
                Limpiar
              </Button>
              <Button
                type="submit"
                disabled={crearSolicitudMutation.isPending}
              >
                {crearSolicitudMutation.isPending ? "Enviando..." : "Enviar Solicitud"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default SolicitudEstablecimientoForm;
