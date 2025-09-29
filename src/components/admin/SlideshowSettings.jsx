import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import { Trash2, Plus, Clock, Loader2 } from "lucide-react";

// Constantes
const CONFIG_ID = 1;
const STORAGE_BUCKET = 'background-images';

const SlideshowSettings = () => {
    const [settings, setSettings] = useState({ duration: 5000, images: [] });
    const [newImageFile, setNewImageFile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // --- FUNCIÓN DE GUARDADO (UPDATED) ---
    // Guarda la Configuración de Duración y URLs en la BD.
    // Recibe la configuración a guardar para ser utilizada en handleAddImage.
    const handleSave = useCallback(async (currentSettings = settings) => {
        // Solo activamos isSaving si no está ya activo (ej: si viene de handleAddImage)
        if (!isSaving) {
            setIsSaving(true);
        }

        const { error } = await supabase
            .from('slideshow_settings')
            .upsert({ 
                id: CONFIG_ID, 
                duration: currentSettings.duration, 
                images: currentSettings.images 
            }, { 
                onConflict: 'id' 
            });

        if (error) {
            console.error("Error al guardar la configuración:", error);
            alert("Error al guardar la configuración.");
        } else {
            console.log("Configuración guardada en Supabase.");
        }
        
        setIsSaving(false); // 👈 SIEMPRE se desactiva al finalizar la BD
    }, [isSaving, settings.duration, settings.images]);

    // --- CARGAR CONFIGURACIÓN INICIAL ---
    const fetchSettings = useCallback(async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('slideshow_settings')
            .select('*')
            .eq('id', CONFIG_ID)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 es "no results"
            console.error("Error al cargar la configuración:", error);
            setSettings({ duration: 5000, images: [] }); 
        } else if (data) {
            setSettings(data);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    // Maneja el cambio de duración
    const handleDurationChange = (e) => {
        setSettings({ ...settings, duration: Number(e.target.value) });
    };

    // --- FUNCIÓN DE AÑADIR IMAGEN (CORREGIDA) ---
    const handleAddImage = async () => {
        if (!newImageFile) return;

        setIsSaving(true); // 👈 Activar el estado de guardado
        const file = newImageFile;
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`; 

        // 1. Subir el archivo al Storage
        const { error: uploadError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(filePath, file);

        if (uploadError) {
            console.error("Error al subir la imagen:", uploadError);
            alert("Error al subir la imagen.");
            setIsSaving(false); // 👈 Desactivar en caso de error de subida
            return;
        }

        // 2. Obtener la URL pública de la imagen
        const { data: publicUrlData } = supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(filePath);

        const imageUrl = publicUrlData.publicUrl;
        
        // 3. Crear el nuevo estado de imágenes
        const updatedImages = [...settings.images, imageUrl];

        // 4. Actualizar el estado local (asíncrono)
        setSettings((prevSettings) => ({
            ...prevSettings,
            images: updatedImages
        }));
        
        setNewImageFile(null); // Limpia la selección

        // 5. Guardar el nuevo estado COMPLETO en la BD
        // Pasamos el nuevo objeto settings para que handleSave lo use inmediatamente
        await handleSave({ ...settings, images: updatedImages });
        // handleSave se encarga de llamar a setIsSaving(false)
    };

    // --- FUNCIÓN DE ELIMINAR IMAGEN ---
    const handleRemoveImage = async (urlToRemove) => {
        const confirmDelete = window.confirm("¿Estás seguro de que quieres eliminar esta imagen?");
        if (!confirmDelete) return;

        setIsSaving(true);

        // Extraer el nombre del archivo de la URL
        // Esto asume que el nombre del archivo es la última parte de la URL
        const fileName = urlToRemove.split('/').pop();
        
        // 1. Eliminar del Storage
        const { error: deleteError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .remove([fileName]);

        if (deleteError) {
            console.error("Error al eliminar la imagen del storage:", deleteError);
            alert("Error al eliminar la imagen del servidor.");
            setIsSaving(false);
            return;
        }

        // 2. Actualizar el estado y la BD
        const updatedImages = settings.images.filter(url => url !== urlToRemove);
        setSettings(prevSettings => ({ ...prevSettings, images: updatedImages }));
        
        // Guardar el nuevo estado de imágenes en la BD
        await handleSave({ ...settings, images: updatedImages });
        // handleSave se encarga de llamar a setIsSaving(false)
    };

    if (isLoading) {
        return (
            <Card>
                <CardContent className="flex justify-center items-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin mr-2" /> 
                    Cargando configuración...
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Ajustes del Carrusel de Fondo</CardTitle>
                <CardDescription>
                    Gestiona las imágenes que aparecen en la página de inicio y la velocidad de transición.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                {/* Ajuste de Duración */}
                <div className="space-y-4">
                    <h3 className="text-xl font-semibold flex items-center">
                        <Clock className="w-5 h-5 mr-2" />
                        Velocidad de Transición
                    </h3>
                    <Label htmlFor="duration">Duración por imagen (milisegundos)</Label>
                    <div className="flex space-x-2">
                        <Input
                            id="duration"
                            type="number"
                            min="1000"
                            step="500"
                            value={settings.duration}
                            onChange={handleDurationChange}
                            placeholder="Ej: 8000"
                        />
                         <Button 
                            onClick={() => handleSave()} 
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> 
                                    Guardando...
                                </>
                            ) : (
                                "Guardar"
                            )}
                        </Button>
                    </div>
                    
                    <p className="text-sm text-gray-500">
                        ({settings.duration / 1000} segundos). Este es el tiempo que cada imagen permanece visible.
                    </p>
                </div>

                {/* Gestión de Imágenes */}
                <div className="space-y-4">
                    <h3 className="text-xl font-semibold">Imágenes del Carrusel ({settings.images.length})</h3>

                    {/* Lista de Imágenes Actuales */}
                    {settings.images.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {settings.images.map((url, index) => (
                                <div key={url} className="relative group overflow-hidden rounded-lg shadow-md">
                                    <img
                                        src={url}
                                        alt={`Fondo ${index + 1}`}
                                        className="w-full h-32 object-cover"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button 
                                            variant="destructive" 
                                            size="icon" 
                                            onClick={() => handleRemoveImage(url)}
                                            aria-label="Eliminar imagen"
                                            disabled={isSaving}
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500">No hay imágenes configuradas para el carrusel.</p>
                    )}

                    {/* Subida de Nueva Imagen */}
                    <div className="pt-4 border-t border-gray-200">
                        <Label htmlFor="new-image">Añadir nueva imagen de fondo</Label>
                        <div className="flex space-x-2 mt-1">
                            <Input
                                id="new-image"
                                type="file"
                                accept="image/*"
                                onChange={(e) => setNewImageFile(e.target.files[0])}
                                className="flex-grow"
                            />
                            <Button 
                                onClick={handleAddImage} 
                                disabled={!newImageFile || isSaving}
                            >
                                {isSaving ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Plus className="w-4 h-4 mr-2" />
                                )}
                                Añadir
                            </Button>
                        </div>
                         {newImageFile && <p className="text-sm text-gray-500 mt-2">Archivo seleccionado: {newImageFile.name}</p>}
                    </div>
                </div>

                
            </CardContent>
        </Card>
    );
};

export default SlideshowSettings;
