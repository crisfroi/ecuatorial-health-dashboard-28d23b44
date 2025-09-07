import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Expand, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import html2canvas from 'html2canvas';

interface ChartActionsProps {
  title: string;
  children: React.ReactNode;
  onDownload?: () => void;
}

const ChartActions = ({ title, children, onDownload }: ChartActionsProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const handleDownload = async () => {
    if (onDownload) {
      onDownload();
    } else if (containerRef.current) {
      const canvas = await html2canvas(containerRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.download = `${title.toLowerCase().replace(/\s+/g, '-')}-chart.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  return (
    <div className="relative group">
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <div className="flex space-x-1">
          <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                <Expand className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl w-full">
              <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
              </DialogHeader>
              <div className="w-full min-h-[400px] h-96">
                {/* Force re-render when dialog opens to ensure proper measurements */}
                {isExpanded && (
                  <div key="expanded-chart">
                    {children}
                  </div>
                )}
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

      {/* Use conditional rendering instead of CSS hiding to prevent measurement issues */}
      {!isExpanded && (
        <div ref={containerRef}>
          {children}
        </div>
      )}
    </div>
  );
};

export default ChartActions;
