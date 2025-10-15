import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const CONFIG_ID = 1;

// Duración del fundido (fija en el frontend)
const FADE_DURATION = 1500; 

const BackgroundSlideshow = () => {
    // 💡 NUEVO: Estados para almacenar la data cargada de Supabase
    const [images, setImages] = useState([]);
    const [transitionDuration, setTransitionDuration] = useState(8000); // Default 8s
    const [isLoading, setIsLoading] = useState(true);

    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // --- FUNCIÓN DE CARGA DE DATOS ---
    const fetchSettings = useCallback(async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('slideshow_settings')
            .select('images, duration') // Selecciona solo los campos necesarios
            .eq('id', CONFIG_ID)
            .single();

        if (error) {
            console.error("Error al cargar la configuración del carrusel:", error?.message ?? error, error);
            // Si hay un error, dejamos los valores por defecto
        } else if (data) {
            // 💡 APLICANDO LAS IMÁGENES y DURACIÓN DE LA BD
            // Garantiza que 'images' es un array (para evitar fallos al mapear)
            setImages(Array.isArray(data.images) ? data.images : []);
            setTransitionDuration(data.duration || 8000); 
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    // --- LÓGICA DEL CARRUSEL ---
    useEffect(() => {
        // Solo inicializa el temporizador si hay imágenes y no está cargando
        if (images.length > 0 && !isLoading) {
            const timer = setInterval(() => {
                setCurrentImageIndex((prevIndex) => 
                    (prevIndex + 1) % images.length // Ciclo: 0, 1, 2, 0, 1, ...
                );
            }, transitionDuration); // Usa la duración cargada de Supabase

            // Limpia el temporizador al desmontar el componente o al cambiar la duración/imágenes
            return () => clearInterval(timer);
        }
    }, [images, transitionDuration, isLoading]); // Dependencias para reiniciar el temporizador

    // Si está cargando o no hay imágenes, podemos mostrar un fondo neutro
    if (isLoading || images.length === 0) {
        return (
            <div className="absolute inset-0 z-0 bg-gray-900/90 flex items-center justify-center">
                {isLoading && (
                    <Loader2 className="h-8 w-8 animate-spin text-white opacity-50" />
                )}
            </div>
        );
    }

    return (
        <div className="absolute inset-0 z-0 overflow-hidden">
            {images.map((image, index) => (
                <div
                    key={image}
                    className={`absolute inset-0 bg-cover bg-center`}
                    style={{
                        backgroundImage: `url(${image})`,
                        // Usa los estados de React para controlar la opacidad
                        opacity: index === currentImageIndex ? 1 : 0, 
                        transition: `opacity ${FADE_DURATION}ms ease-in-out`, 
                        // Posiciona la imagen actual por encima
                        zIndex: index === currentImageIndex ? 1 : 0,
                    }}
                />
            ))}
             
            {/* Overlay Semitransparente para mejorar la legibilidad del texto */}
            <div className="absolute inset-0 bg-black opacity-40 z-2" />
        </div>
    );
};

export default BackgroundSlideshow;
