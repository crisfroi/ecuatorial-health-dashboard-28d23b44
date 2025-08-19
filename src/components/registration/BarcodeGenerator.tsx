import React, { useEffect, useRef } from 'react';

interface BarcodeGeneratorProps {
  code: string;
  width?: number;
  height?: number;
  className?: string;
}

export const BarcodeGenerator = ({ code, width = 200, height = 50, className = "" }: BarcodeGeneratorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!code || !canvasRef.current) return;

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

    // Configurar el canvas con DPI alto para mejor calidad
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(dpr, dpr);

    // Limpiar canvas con fondo blanco
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);

    // Generar código de barras simple basado en Code 128
    ctx.fillStyle = 'black';
    
    // Calcular dimensiones
    const barCount = code.length * 6; // 6 barras por carácter aproximadamente
    const barWidth = Math.floor((width - 20) / barCount); // Dejar margen
    const barHeight = height - 25; // Dejar espacio para el texto
    const startX = 10;
    const startY = 5;

    // Generar patrón de barras más realista
    let x = startX;
    for (let i = 0; i < code.length; i++) {
      const charCode = code.charCodeAt(i);
      
      // Patrón basado en el código ASCII del carácter
      const pattern = [
        charCode % 2 === 0 ? 1 : 0,
        charCode % 3 === 0 ? 1 : 0, 
        charCode % 5 === 0 ? 1 : 0,
        charCode % 7 === 0 ? 1 : 0,
        1, // barra de separación
        0  // espacio
      ];

      pattern.forEach((bar, idx) => {
        if (bar === 1) {
          const currentBarWidth = idx === 4 ? barWidth * 0.5 : barWidth;
          ctx.fillRect(x, startY, currentBarWidth, barHeight);
        }
        x += barWidth;
      });
    }

    // Agregar el texto del código debajo de las barras
    ctx.fillStyle = 'black';
    ctx.font = `${Math.min(12, height / 4)}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(code, width / 2, height - 5);
    } catch (error) {
      // Suppress ResizeObserver-related errors from canvas operations
      if (
        error instanceof Error &&
        (
          error.message.includes('ResizeObserver loop completed with undelivered notifications') ||
          error.message.includes('ResizeObserver loop limit exceeded')
        )
      ) {
        return;
      }
      console.error('Error generating barcode:', error);
    }
  }, [code, width, height]);

  if (!code) return null;

  return (
    <div className={`inline-block ${className}`}>
      <canvas 
        ref={canvasRef} 
        className="border border-gray-300 bg-white rounded"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
};
