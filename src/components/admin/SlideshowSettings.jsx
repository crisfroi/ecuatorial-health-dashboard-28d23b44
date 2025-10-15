import React, { useState, useEffect, useCallback } from 'react';
import React, { useState, useEffect, useCallback } from 'react';
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
import { Trash2, Plus, Clock, Loader2, ArrowUp, ArrowDown } from "lucide-react";

// Constantes
const CONFIG_ID = 1;
const STORAGE_BUCKET = 'background-images';

const SlideshowSettings = () => {
    // newImageFile ahora es un FileList (similar a un array de archivos)
    const [settings, setSettings] = useState({ duration: 5000, images: [] });
    const [newImageFile, setNewImageFile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // --- FUNCIÓN DE GUARDADO ---
    // Guarda la Configuración de Duración y URLs en la BD.
    const handleSave = useCallback(async (currentSettings) => {
        const settingsToSave = currentSettings || settings;

        // Solo activar isSaving si aún no está activo (previene doble activación)
        if (!isSaving && !currentSettings) {
             setIsSaving(true);
        }

        const { error } = await supabase
            .from('slideshow_settings')
            .upsert({ 
                id: CONFIG_ID, 
                duration: settingsToSave.duration, 
                images: settingsToSave.images // Asegúrate de que esta columna es de tipo JSONB en Supabase
            }, { 
                onConflict: 'id' 
            });

        if (error) {
            console.error("Error al guardar la configuración:", error);
            alert("Error al guardar la configuración: " + error.message);
        } else {
            console.log("Configuración guardada en Supabase.");
        }
        
        setIsSaving(false);
        return !error; // Retorna true si fue exitoso
    }, [isSaving, settings]);

    // --- CARGAR CONFIGURACIÓN INICIAL ---
    const fetchSettings = useCallback(async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('slideshow_settings')
            .select('*')
            .eq('id', CONFIG_ID)
            .single();

        if (error && error.code !== 'PGRST116') { 
            console.error("Error al cargar la configuración:", error?.message ?? error, error);
            // Fallback en caso de error de conexión/permiso (no 'no results')
            setSettings({ duration: 5000, images: [] }); 
        } else if (data) {
            // ✅ Solución al problema de visualización:
            // Forzar que el campo 'images' sea un array en caso de ser null o no inicializado.
            setSettings({
                ...data,
                images: Array.isArray(data.images) ? data.images : []
            });
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


    // --- 2. Subir múltiples imágenes a Storage y actualizar la lista ---
    const handleAddImage = async () => {
        if (!newImageFile || newImageFile.length === 0) return;

        setIsSaving(true); 
        const filesToUpload = Array.from(newImageFile);
        const uploadedUrls = [];
        let uploadFailed = false;

        for (const file of filesToUpload) {
            // Generar nombre de archivo único y seguro
            const fileExt = file.name.split('.').pop();
            const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const fileName = `${Date.now()}_${safeName}`;
            const filePath = `${fileName}`;

            // 2a. Subir el archivo al Storage
            const { error: uploadError } = await supabase.storage
                .from(STORAGE_BUCKET)
                .upload(filePath, file);

            if (uploadError) {
                console.error(`Error al subir la imagen ${file.name}:`, uploadError);
                alert(`Error al subir la imagen ${file.name}.`);
                uploadFailed = true;
                break; // Detener la subida si un archivo falla
            }

            // 2b. Obtener la URL pública de la imagen
            const { data: publicUrlData } = supabase.storage
                .from(STORAGE_BUCKET)
                .getPublicUrl(filePath);

            uploadedUrls.push(publicUrlData.publicUrl);
        }

        setNewImageFile(null); // Limpia la selección de archivos

        if (uploadFailed) {
            setIsSaving(false);
            return;
        }

        // 2c. Actualizar el estado y guardar en BD
        const newImages = [...settings.images, ...uploadedUrls];
        setSettings((prevSettings) => ({
            ...prevSettings,
            images: newImages
        }));

        // Guardar el nuevo array de URLs en la base de datos
        await handleSave({ ...settings, images: newImages });
        // handleSave se encarga de llamar a setIsSaving(false)
    };


    // --- 3. Eliminar imagen del Storage y de la lista ---
    const handleRemoveImage = async (urlToRemove) => {
        const confirmDelete = window.confirm("¿Estás seguro de que quieres eliminar esta imagen?");
        if (!confirmDelete) return;

        setIsSaving(true);
        // El nombre del archivo es la última parte de la URL
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
        await handleSave({ ...settings, images: updatedImages });
    };


    // --- 4. Reordenar Imágenes ---
    const handleMoveImage = async (index, direction) => {
        const newImages = [...settings.images];
        const newIndex = index + direction;

        // Comprobar límites
        if (newIndex < 0 || newIndex >= newImages.length) return;

        setIsSaving(true);

        // Intercambiar elementos (swap)
        [newImages[index], newImages[newIndex]] = [newImages[newIndex], newImages[index]];

        // 1. Actualizar estado local
        setSettings(prevSettings => ({ ...prevSettings, images: newImages }));

        // 2. Guardar en BD (handleSave se encargará de isSaving(false))
        await handleSave({ ...settings, images: newImages });
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {settings.images.map((url, index) => (
                                <div key={url} className="relative group overflow-hidden rounded-lg shadow-md border">
                                    <img
                                        src={url}
                                        alt={`Fondo ${index + 1}`}
                                        className="w-full h-32 object-cover"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity space-x-2">
                                        
                                        {/* Botón Mover Arriba */}
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            onClick={() => handleMoveImage(index, -1)}
                                            disabled={isSaving || index === 0}
                                            aria-label="Mover imagen hacia arriba"
                                        >
                                            <ArrowUp className="h-4 w-4" />
                                        </Button>

                                        {/* Botón Mover Abajo */}
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            onClick={() => handleMoveImage(index, 1)}
                                            disabled={isSaving || index === settings.images.length - 1}
                                            aria-label="Mover imagen hacia abajo"
                                        >
                                            <ArrowDown className="h-4 w-4" />
                                        </Button>

                                        {/* Botón Eliminar */}
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
                        <Label htmlFor="new-image">Añadir nuevas imágenes de fondo</Label>
                        <div className="flex space-x-2 mt-1">
                            <Input
                                id="new-image"
                                type="file"
                                accept="image/*"
                                multiple // 👈 PERMITE SELECCIÓN MÚLTIPLE
                                onChange={(e) => setNewImageFile(e.target.files)} // 👈 CAPTURA FileList
                                className="flex-grow"
                            />
                            <Button 
                                onClick={handleAddImage} 
                                disabled={!newImageFile || newImageFile.length === 0 || isSaving}
                            >
                                {isSaving ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Plus className="w-4 h-4 mr-2" />
                                )}
                                Añadir {newImageFile && newImageFile.length > 0 ? `(${newImageFile.length})` : ''}
                            </Button>
                        </div>
                        {newImageFile && newImageFile.length > 0 && 
                            <p className="text-sm text-gray-500 mt-2">
                                Archivos seleccionados: {newImageFile.length}
                            </p>
                        }
                    </div>
                </div>

                
            </CardContent>
        </Card>
    );
};

export default SlideshowSettings;
