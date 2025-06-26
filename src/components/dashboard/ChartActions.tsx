
import { Button } from '@/components/ui/button';
import { Expand, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';

interface ChartActionsProps {
  title: string;
  children: React.ReactNode;
  onDownload?: () => void;
}

const ChartActions = ({ title, children, onDownload }: ChartActionsProps) => {
  const { toast } = useToast();

  const handleDownload = async () => {
    if (onDownload) {
      onDownload();
    } else {
      try {
        // Find the chart container
        const chartElement = document.querySelector('.recharts-wrapper') as HTMLElement;
        if (!chartElement) {
          toast({
            title: "Error",
            description: "No se pudo encontrar el gráfico para descargar",
            variant: "destructive",
          });
          return;
        }

        const canvas = await html2canvas(chartElement, {
          backgroundColor: '#ffffff',
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          width: chartElement.offsetWidth,
          height: chartElement.offsetHeight
        });

        const link = document.createElement('a');
        link.download = `${title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();

        toast({
          title: "Gráfico descargado",
          description: "El gráfico se ha descargado correctamente",
          variant: "default",
        });
      } catch (error) {
        console.error('Error downloading chart:', error);
        toast({
          title: "Error",
          description: "No se pudo descargar el gráfico",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="relative group">
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <div className="flex space-x-1">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                <Expand className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl w-full">
              <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
              </DialogHeader>
              <div className="w-full h-96">
                {children}
              </div>
            </DialogContent>
          </Dialog>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 w-8 p-0"
            onClick={handleDownload}
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>
      {children}
    </div>
  );
};

export default ChartActions;
