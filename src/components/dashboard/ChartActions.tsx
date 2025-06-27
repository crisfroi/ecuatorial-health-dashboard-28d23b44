
import { Button } from '@/components/ui/button';
import { Expand, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface ChartActionsProps {
  title: string;
  children: React.ReactNode;
  onDownload?: () => void;
}

const ChartActions = ({ title, children, onDownload }: ChartActionsProps) => {
  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else {
      // Default download functionality
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Create a simple download of the chart
        const link = document.createElement('a');
        link.download = `${title.toLowerCase().replace(/\s+/g, '-')}-chart.png`;
        link.href = canvas.toDataURL();
        link.click();
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
