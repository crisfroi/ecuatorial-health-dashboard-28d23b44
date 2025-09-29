import { useState, useEffect } from 'react';

// 💡 Mock data (Simularemos que esto vendrá de un estado global o una API más adelante)
// Las imágenes deben estar en la carpeta /public/backgrounds/
const IMAGES = [
    '/backgrounds/imagen1.jpg',
    '/backgrounds/imagen2.png',
   
    // Asegúrate de crear estos archivos en public/backgrounds/
];

// 💡 Mock configuration (Simularemos que esto vendrá del componente Admin)
const TRANSITION_DURATION = 8000; // 8 segundos por imagen
const FADE_DURATION = 1500;      // 1.5 segundos para la transición de fundido

const BackgroundSlideshow = () => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        // Inicializa el temporizador para cambiar la imagen
        const timer = setInterval(() => {
            setCurrentImageIndex((prevIndex) => 
                (prevIndex + 1) % IMAGES.length // Ciclo: 0, 1, 2, 0, 1, ...
            );
        }, TRANSITION_DURATION);

        // Limpia el temporizador al desmontar el componente
        return () => clearInterval(timer);
    }, []); 

    return (
        <div className="absolute inset-0 z-0 overflow-hidden">
            {IMAGES.map((image, index) => (
                <div
                    key={image}
                    className={`absolute inset-0 bg-cover bg-center`}
                    // Utilizamos Tailwind para la duración de la transición de fundido
                    style={{
                        backgroundImage: `url(${image})`,
                        opacity: index === currentImageIndex ? 1 : 0, 
                        transition: `opacity ${FADE_DURATION}ms ease-in-out`, // Animación de fundido
                        // Posiciona la imagen actual por encima de las demás para asegurar la visibilidad
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
