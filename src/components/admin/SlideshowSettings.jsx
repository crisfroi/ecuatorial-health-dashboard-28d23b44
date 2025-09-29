import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase"; // 👈 Asegúrate de que esta ruta sea correcta
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

// ID de la única fila de configuración (podría ser un valor constante)
const CONFIG_ID = 1; 
const STORAGE_BUCKET = 'background-images'; 

const SlideshowSettings = () => {
    const [settings, setSettings] = useState({ duration: 5000, images: [] });
    const [newImageFile, setNewImageFile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // 1. Cargar Configuración Inicial de la BD
    const fetchSettings = useCallback(async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('slideshow_settings')
            .select('*')
            .eq('id', CONFIG_ID)
            .single();

        if (error) {
            console.error("Error al cargar la configuración:", error);
            // Si no existe, usamos valores por defecto
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

    // 2. Subir imagen a Supabase Storage y actualizar la lista
    const handleAddImage = async () => {
        if (!newImageFile) return;

        setIsSaving(true);
        const file = newImageFile;
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`; 

        // 2a. Subir el archivo al Storage
        const { error: uploadError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(filePath, file);

        if (uploadError) {
            console.error("Error al subir la imagen:", uploadError);
            alert("Error al subir la imagen.");
            setIsSaving(false);
            return;
        }

        // 2b. Obtener la URL pública de la imagen
        const { data: publicUrlData } = supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(filePath);

        const imageUrl = publicUrlData.publicUrl;

        // 2c. Actualizar el estado con la nueva URL
        setSettings((prevSettings) => ({
            ...prevSettings,
            images: [...prevSettings.images, imageUrl] 
        }));
        
        setNewImageFile(null); // Limpia la selección
        await handleSave({ ...settings, images: [...settings.images, imageUrl] }); // Guarda inmediatamente el cambio
    };

    // 3. Eliminar imagen del Storage y de la lista
    const handleRemoveImage = async (urlToRemove) => {
        const confirmDelete = window.confirm("¿Estás seguro de que quieres eliminar esta imagen?");
        if (!confirmDelete) return;

        setIsSaving(true);

        // Extraer el nombre del archivo de la URL
        const fileName = urlToRemove.split('/').pop();
        
        // 3a. Eliminar del Storage
        const { error: deleteError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .remove([fileName]);

        if (deleteError) {
            console.error("Error al eliminar la imagen del storage:", deleteError);
            alert("Error al eliminar la imagen del servidor.");
            setIsSaving(false);
            return;
        }

        // 3b. Actualizar el estado y la BD
        const updatedImages = settings.images.filter(url => url !== urlToRemove);
        setSettings(prevSettings => ({ ...prevSettings, images: updatedImages }));
        await handleSave({ ...settings, images: updatedImages });
    };

    // 4. Guardar la Configuración de Duración y URLs en la BD
    const handleSave = async (currentSettings = settings) => {
        setIsSaving(true);

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
        setIsSaving(false);
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
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
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
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                                Añadir
                            </Button>
                        </div>
                    </div>
                </div>

                
            </CardContent>
        </Card>
    );
};

export default SlideshowSettings;
