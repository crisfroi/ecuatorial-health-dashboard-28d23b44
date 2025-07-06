
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

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Configurar código de barras
    ctx.fillStyle = 'black';
    const barWidth = width / (code.length * 2);
    
    // Generar patrón de barras basado en el código
    for (let i = 0; i < code.length; i++) {
      const char = code.charCodeAt(i);
      const barHeight = (height * 0.7);
      
      // Alternar entre barras gruesas y delgadas basado en el carácter
      if (char % 2 === 0) {
        ctx.fillRect(i * barWidth * 2, 5, barWidth, barHeight);
      } else {
        ctx.fillRect(i * barWidth * 2, 5, barWidth * 0.5, barHeight);
      }
    }

    // Agregar texto del código debajo
    ctx.fillStyle = 'black';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(code, width / 2, height - 5);

  }, [code, width, height]);

  if (!code) return null;

  return (
    <div className={`inline-block ${className}`}>
      <canvas 
        ref={canvasRef} 
        width={width} 
        height={height}
        className="border border-gray-300 bg-white"
      />
    </div>
  );
};
