import { Download, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SelloNormalizado } from "@/hooks/useSellos";

interface SelloDisplayProps {
  sello: SelloNormalizado | null | undefined;
  titulo: string;
  /** Compacto: sin botón de descarga, para cartas y documentos imprimibles */
  compact?: boolean;
  size?: number;
  className?: string;
  nombreArchivo?: string;
}

export const SelloDisplay = ({
  sello,
  titulo,
  compact = false,
  size = 120,
  className = "",
  nombreArchivo,
}: SelloDisplayProps) => {
  if (!sello) return null;

  const handleDownload = async () => {
    if (!sello.url) return;
    try {
      const res = await fetch(sello.url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${nombreArchivo || `sello-${sello.tipo}`}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      window.open(sello.url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className={`text-center ${className}`}>
      {sello.url ? (
        <img
          src={sello.url}
          alt={titulo}
          crossOrigin="anonymous"
          style={{ width: size, height: size }}
          className="object-contain mx-auto"
        />
      ) : (
        <div
          style={{ width: size, height: size }}
          className="mx-auto flex items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/40"
        >
          <ShieldCheck className="w-6 h-6 text-muted-foreground" />
        </div>
      )}

      <p className="text-[10px] font-semibold uppercase tracking-wide mt-1">{titulo}</p>
      {sello.codigo && <p className="text-[10px] font-mono">{sello.codigo}</p>}
      {sello.hash && (
        <p className="text-[8px] font-mono break-all text-muted-foreground max-w-[180px] mx-auto">
          {sello.hash.slice(0, 32)}…
        </p>
      )}

      {!compact && sello.url && (
        <Button variant="outline" size="sm" className="mt-2" onClick={handleDownload}>
          <Download className="w-3 h-3 mr-1" />
          Descargar sello
        </Button>
      )}
    </div>
  );
};

export default SelloDisplay;
