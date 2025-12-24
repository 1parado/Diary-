import React from 'react';
import { Download } from 'lucide-react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { useReactFlow, getRectOfNodes, getTransformForBounds } from 'reactflow';
import { toPng, toJpeg } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';

export const DownloadButton = () => {
  const { getNodes } = useReactFlow();

  const downloadImage = async (format: 'png' | 'jpeg') => {
    const nodes = getNodes();
    if (nodes.length === 0) return;

    // Calculate bounds to fit all nodes
    const nodesBounds = getRectOfNodes(nodes);
    const transform = getTransformForBounds(
      nodesBounds,
      nodesBounds.width,
      nodesBounds.height,
      0.5,
      2
    );

    const viewport = document.querySelector('.react-flow__viewport') as HTMLElement;
    
    if (!viewport) return;

    try {
      const dataUrl = await (format === 'png' ? toPng(viewport, {
        backgroundColor: '#fff',
        width: nodesBounds.width,
        height: nodesBounds.height,
        style: {
          width: nodesBounds.width.toString(),
          height: nodesBounds.height.toString(),
          transform: `translate(${transform[0]}px, ${transform[1]}px) scale(${transform[2]})`,
        },
      }) : toJpeg(viewport, {
        backgroundColor: '#fff',
        width: nodesBounds.width,
        height: nodesBounds.height,
        style: {
          width: nodesBounds.width.toString(),
          height: nodesBounds.height.toString(),
          transform: `translate(${transform[0]}px, ${transform[1]}px) scale(${transform[2]})`,
        },
      }));

      const a = document.createElement('a');
      a.setAttribute('download', `mindmap.${format}`);
      a.setAttribute('href', dataUrl);
      a.click();
      toast.success('Downloaded successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to download image');
    }
  };

  const downloadPDF = async () => {
     const nodes = getNodes();
    if (nodes.length === 0) return;

    const nodesBounds = getRectOfNodes(nodes);
    const transform = getTransformForBounds(
      nodesBounds,
      nodesBounds.width,
      nodesBounds.height,
      0.5,
      2
    );

    const viewport = document.querySelector('.react-flow__viewport') as HTMLElement;
    if (!viewport) return;

    try {
        const dataUrl = await toPng(viewport, {
            backgroundColor: '#fff',
            width: nodesBounds.width,
            height: nodesBounds.height,
            style: {
              width: nodesBounds.width.toString(),
              height: nodesBounds.height.toString(),
              transform: `translate(${transform[0]}px, ${transform[1]}px) scale(${transform[2]})`,
            },
        });

        const pdf = new jsPDF({
            orientation: 'landscape',
        });
        const imgProps = pdf.getImageProperties(dataUrl);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save('mindmap.pdf');
        toast.success('PDF Downloaded');
    } catch (e) {
        console.error(e);
        toast.error('Failed to export PDF');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" /> Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => downloadImage('png')}>
          Export as PNG
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => downloadImage('jpeg')}>
          Export as JPEG
        </DropdownMenuItem>
        <DropdownMenuItem onClick={downloadPDF}>
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
