import React, { useState } from "react";
import { useForm } from "react-hook-form";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import EstablishmentRequestLetter from "@/components/registration/EstablishmentRequestLetter";
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
import { getErrorMessage } from "@/utils/errorHandler";
import { useNacionalidades } from "@/hooks/useNacionalidades";

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
  nif: z.string().min(1, "El NIF es requerido"),
  tipo_documento: z.string().min(1, "El tipo de documento es requerido"),
  numero_documento: z.string().min(1, "El número de documento es requerido"),
  nacionalidad_responsable: z.string().min(1, "La nacionalidad es requerida"),
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
  const [personalCategorias, setPersonalCategorias] = useState({ medicos: 0, enfermeria: 0, farmacia: 0, laboratorio: 0, otros: 0 });
  const [personalListado, setPersonalListado] = useState<{ nombre: string; telefono: string; categoria: string }[]>([]);
  const [asesorTecnico, setAsesorTecnico] = useState<{ nombre: string; telefono: string; formacion: string }>({ nombre: "", telefono: "", formacion: "" });
  const [printSolicitud, setPrintSolicitud] = useState<any | null>(null);

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
      nif: "",
      tipo_documento: "",
      numero_documento: "",
      nacionalidad_responsable: "",
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
  const { data: nacionalidades = [] } = useNacionalidades();
  const nacionalidadesUnicas = React.useMemo(() => {
    const seen = new Set<string>();
    return (nacionalidades || []).filter((n: any) => {
      const name = (n?.nacionalidad || "").trim();
      if (!name) return false;
      if (seen.has(name)) return false;
      seen.add(name);
      return true;
    });
  }, [nacionalidades]);

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

  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (data: SolicitudFormData) => {
    setSubmitting(true);
    const safety = setTimeout(() => setSubmitting(false), 20000);
    try {
      const fechaSolicitudIso = new Date().toISOString();
      await crearSolicitudMutation.mutateAsync({
        ...data,
        fotos_establecimiento: fotosEstablecimiento,
        documentos_adicionales: documentosAdicionales,
        servicios_ofrecidos: [...(data.servicios_ofrecidos || []), ...serviciosPersonalizados],
        areas_especializadas: [...(data.areas_especializadas || []), ...areasPersonalizadas],
        personal_apertura: {
          categorias: personalCategorias,
          personas: personalListado,
        },
        asesor_tecnico: asesorTecnico,
      });

      const solicitudParaImpresion = {
        ...data,
        fecha_solicitud: fechaSolicitudIso,
        personal_apertura: {
          categorias: personalCategorias,
          personas: personalListado,
        },
        asesor_tecnico: asesorTecnico,
      };
      setPrintSolicitud(solicitudParaImpresion);
      await new Promise((r) => setTimeout(r, 50));
      const el = document.getElementById('est-letter-print-on-submit');
      if (el) {
        const canvas = await html2canvas(el as HTMLElement, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= 297;
        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= 297;
        }
        const fileSafeName = (data.nombre_establecimiento || 'establecimiento').replace(/[^a-zA-Z0-9-_]+/g, '_');
        pdf.save(`carta-solicitud-establecimiento-${fileSafeName}.pdf`);
      }

      // Limpiar formulario
      form.reset();
      setFotosEstablecimiento([]);
      setDocumentosAdicionales([]);
      setServiciosPersonalizados([]);
      setAreasPersonalizadas([]);
      setPersonalCategorias({ medicos: 0, enfermeria: 0, farmacia: 0, laboratorio: 0, otros: 0 });
      setPersonalListado([]);
      setAsesorTecnico({ nombre: "", telefono: "", formacion: "" });
      setPrintSolicitud(null);
    } catch (error) {
      const message = getErrorMessage(error);
      console.error("Error enviando solicitud:", message, error);
    } finally {
      clearTimeout(safety);
      setSubmitting(false);
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
                name="nif"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número NIF *</FormLabel>
                    <FormControl>
                      <Input placeholder="NIF del responsable" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tipo_documento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Documento *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione el tipo de documento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="DIP">DIP</SelectItem>
                        <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                        <SelectItem value="NIE">NIE</SelectItem>
                        <SelectItem value="Otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="numero_documento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Documento *</FormLabel>
                    <FormControl>
                      <Input placeholder="Número del documento" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nacionalidad_responsable"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nacionalidad del Responsable *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione la nacionalidad" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {nacionalidadesUnicas.map((nac) => (
                          <SelectItem key={`${nac.id}-${nac.nacionalidad}`} value={nac.nacionalidad}>
                            {nac.nacionalidad}
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

            {/* Plan de Personal para Apertura */}
            <div className="space-y-4">
              <FormLabel>Plan de Personal para Apertura</FormLabel>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {([
                  { key: 'medicos', label: 'Médicos' },
                  { key: 'enfermeria', label: 'Enfermería' },
                  { key: 'farmacia', label: 'Farmacia' },
                  { key: 'laboratorio', label: 'Laboratorio' },
                  { key: 'otros', label: 'Otros' },
                ] as const).map((item) => (
                  <div key={item.key}>
                    <label className="text-sm font-medium">{item.label}</label>
                    <Input
                      type="number"
                      min={0}
                      value={(personalCategorias as any)[item.key]}
                      onChange={(e) => setPersonalCategorias({ ...personalCategorias, [item.key]: parseInt(e.target.value || '0', 10) })}
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="font-medium">Listado de Personal (Nombres y Teléfonos)</h5>
                  <Button type="button" size="sm" onClick={() => setPersonalListado([...personalListado, { nombre: '', telefono: '', categoria: '' }])}>
                    Añadir Persona
                  </Button>
                </div>
                {personalListado.length === 0 ? (
                  <p className="text-sm text-gray-500">No se han añadido personas</p>
                ) : (
                  <div className="space-y-2">
                    {personalListado.map((p, idx) => (
                      <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
                        <div className="md:col-span-4">
                          <label className="text-sm font-medium">Nombre</label>
                          <Input value={p.nombre} onChange={(e) => {
                            const copy = [...personalListado];
                            copy[idx] = { ...copy[idx], nombre: e.target.value };
                            setPersonalListado(copy);
                          }} />
                        </div>
                        <div className="md:col-span-4">
                          <label className="text-sm font-medium">Teléfono</label>
                          <Input value={p.telefono} onChange={(e) => {
                            const copy = [...personalListado];
                            copy[idx] = { ...copy[idx], telefono: e.target.value };
                            setPersonalListado(copy);
                          }} />
                        </div>
                        <div className="md:col-span-3">
                          <label className="text-sm font-medium">Categoría</label>
                          <Select value={p.categoria} onValueChange={(v) => {
                            const copy = [...personalListado];
                            copy[idx] = { ...copy[idx], categoria: v };
                            setPersonalListado(copy);
                          }}>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Médicos">Médicos</SelectItem>
                              <SelectItem value="Enfermería">Enfermería</SelectItem>
                              <SelectItem value="Farmacia">Farmacia</SelectItem>
                              <SelectItem value="Laboratorio">Laboratorio</SelectItem>
                              <SelectItem value="Otros">Otros</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="md:col-span-1 flex justify-end">
                          <Button type="button" variant="ghost" className="text-red-600" onClick={() => setPersonalListado(personalListado.filter((_, i) => i !== idx))}>✕</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Asesor Técnico */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium">Asesor Técnico</label>
                <Input value={asesorTecnico.nombre} onChange={(e) => setAsesorTecnico({ ...asesorTecnico, nombre: e.target.value })} placeholder="Nombre del asesor técnico" />
              </div>
              <div>
                <label className="text-sm font-medium">Teléfono</label>
                <Input value={asesorTecnico.telefono} onChange={(e) => setAsesorTecnico({ ...asesorTecnico, telefono: e.target.value })} placeholder="+240..." />
              </div>
              <div>
                <label className="text-sm font-medium">Grado de Formación</label>
                <Input value={asesorTecnico.formacion} onChange={(e) => setAsesorTecnico({ ...asesorTecnico, formacion: e.target.value })} placeholder="Ej. Licenciatura, Máster, Especialista" />
              </div>
            </div>

            {/* Fotos del Establecimiento */}
            <div className="space-y-4">
              <FormLabel>Fotos del Establecimiento</FormLabel>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Camera className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <label htmlFor="fotos-establecimiento" className="cursor-pointer">
                      <Button type="button" variant="outline" asChild>
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
                    />
                    <p className="mt-2 text-sm text-gray-600">
                      Máximo 5 fotos (JPG, PNG)
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
                    <label htmlFor="documentos-adicionales" className="cursor-pointer">
                      <Button type="button" variant="outline" asChild>
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
                    />
                    <p className="mt-2 text-sm text-gray-600">
                      PDF, JPG, PNG (máx. 5MB cada uno)
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
                disabled={submitting || crearSolicitudMutation.isPending}
              >
                {submitting || crearSolicitudMutation.isPending ? "Enviando..." : "Enviar Solicitud"}
              </Button>
            </div>
          </form>
          <div style={{ position: 'fixed', left: '-10000px', top: 0, opacity: 0, pointerEvents: 'none', width: '210mm', minHeight: '297mm', zIndex: -1 }}>
            {printSolicitud && (
              <div id="est-letter-print-on-submit" style={{ backgroundColor: '#ffffff' }}>
                <EstablishmentRequestLetter solicitud={{
                  nombre_establecimiento: printSolicitud.nombre_establecimiento,
                  categoria: printSolicitud.categoria,
                  tipo_servicio: printSolicitud.tipo_servicio,
                  provincia: printSolicitud.provincia,
                  distrito_sanitario: printSolicitud.distrito_sanitario || '',
                  direccion: printSolicitud.direccion,
                  director_responsable: printSolicitud.director_responsable,
                  telefono: printSolicitud.telefono,
                  email: printSolicitud.email,
                  personal_apertura: printSolicitud.personal_apertura,
                  asesor_tecnico: printSolicitud.asesor_tecnico,
                  fecha_solicitud: printSolicitud.fecha_solicitud,
                  numero_solicitud: undefined,
                }} />
              </div>
            )}
          </div>
        </Form>
      </CardContent>
    </Card>
  );
};

export default SolicitudEstablecimientoForm;
