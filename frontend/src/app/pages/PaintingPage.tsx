import { useState, useRef, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Slider } from '../components/ui/slider';
import { Eraser, Download, Palette, Undo, Redo, Sparkles, Image as ImageIcon, Trash2, ChevronDown } from 'lucide-react';
import { useDiary } from '../contexts/DiaryContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { format } from 'date-fns';

export function PaintingPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(5);
  const [tool, setTool] = useState<'brush' | 'eraser'>('brush');
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);
  
  const { entries } = useDiary();
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [comicPanels, setComicPanels] = useState<string[]>([]); // URLs of generated images

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set initial canvas size to match container
    const container = canvas.parentElement;
    if (container) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      
      // Fill with white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      saveHistory();
    }

    const handleResize = () => {
        if (container) {
             // Save current content
             const tempCanvas = document.createElement('canvas');
             tempCanvas.width = canvas.width;
             tempCanvas.height = canvas.height;
             tempCanvas.getContext('2d')?.drawImage(canvas, 0, 0);

             canvas.width = container.clientWidth;
             canvas.height = container.clientHeight;
             
             // Restore content
             ctx.fillStyle = '#ffffff';
             ctx.fillRect(0, 0, canvas.width, canvas.height);
             ctx.drawImage(tempCanvas, 0, 0);
        }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const saveHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    
    const { offsetX, offsetY } = getCoordinates(e, canvas);
    
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { offsetX, offsetY } = getCoordinates(e, canvas);

    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx?.closePath();
        saveHistory();
      }
    }
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    
    const rect = canvas.getBoundingClientRect();
    return {
      offsetX: clientX - rect.left,
      offsetY: clientY - rect.top
    };
  };

  const undo = () => {
    if (historyStep > 0) {
      const newStep = historyStep - 1;
      setHistoryStep(newStep);
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        ctx.putImageData(history[newStep], 0, 0);
      }
    }
  };

  const redo = () => {
    if (historyStep < history.length - 1) {
      const newStep = historyStep + 1;
      setHistoryStep(newStep);
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        ctx.putImageData(history[newStep], 0, 0);
      }
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      saveHistory();
    }
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = `painting-${format(new Date(), 'yyyyMMdd-HHmmss')}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const generateComic = async () => {
    if (!selectedEntryId) return;
    
    setIsGenerating(true);
    // Simulate AI generation delay
    setTimeout(() => {
        // Mock generated images (placeholder URLs)
        const mockImages = [
            'https://placehold.co/400x300/indigo/white?text=Panel+1',
            'https://placehold.co/400x300/purple/white?text=Panel+2',
            'https://placehold.co/400x300/pink/white?text=Panel+3',
            'https://placehold.co/400x300/orange/white?text=Panel+4'
        ];
        setComicPanels(mockImages);
        setIsGenerating(false);
    }, 2000);
  };

  const downloadComic = async () => {
    if (comicPanels.length === 0) return;

    const canvas = document.createElement('canvas');
    // Assume 2x2 grid, each image 400x300
    const panelWidth = 400;
    const panelHeight = 300;
    const gap = 10;
    // Layout: 2 columns, rows depend on count
    const cols = 2;
    const rows = Math.ceil(comicPanels.length / cols);
    
    canvas.width = panelWidth * cols + gap * (cols - 1);
    canvas.height = panelHeight * rows + gap * (rows - 1);
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const loadImage = (url: string) => new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => {
             // Fallback for placeholder if CORS fails or other error
             console.warn('Failed to load image for comic download:', url);
             // Create a fallback colored rect
             const fallback = document.createElement('canvas');
             fallback.width = panelWidth;
             fallback.height = panelHeight;
             const fctx = fallback.getContext('2d');
             if(fctx) {
                 fctx.fillStyle = '#eee';
                 fctx.fillRect(0,0, panelWidth, panelHeight);
                 fctx.fillStyle = '#000';
                 fctx.fillText('Image Error', 10, 50);
             }
             const fallbackImg = new Image();
             fallbackImg.src = fallback.toDataURL();
             fallbackImg.onload = () => resolve(fallbackImg);
        };
        img.src = url;
    });

    try {
        const images = await Promise.all(comicPanels.map(loadImage));
        
        // Draw images in grid
        images.forEach((img, i) => {
            const row = Math.floor(i / cols);
            const col = i % cols;
            const x = col * (panelWidth + gap);
            const y = row * (panelHeight + gap);
            ctx.drawImage(img, x, y, panelWidth, panelHeight);
        });

        const link = document.createElement('a');
        link.download = `comic-${format(new Date(), 'yyyyMMdd-HHmmss')}.png`;
        link.href = canvas.toDataURL();
        link.click();
    } catch (error) {
        console.error('Failed to download comic:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col h-screen">
      {/* Toolbar */}
      <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 border-r border-slate-200 pr-4">
             <Button
                variant={tool === 'brush' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setTool('brush')}
                title="Brush"
             >
                <Palette className="w-5 h-5" />
             </Button>
             <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border-none"
                disabled={tool === 'eraser'}
             />
             <div className="w-32 px-2">
                <Slider
                    defaultValue={[5]}
                    max={50}
                    step={1}
                    value={[lineWidth]}
                    onValueChange={(val) => setLineWidth(val[0])}
                />
             </div>
          </div>
          
          <div className="flex items-center gap-2 border-r border-slate-200 pr-4">
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant={tool === 'eraser' ? 'secondary' : 'ghost'}
                        size="icon"
                        className="gap-1 px-2 w-auto min-w-[3.5rem]"
                        title="Eraser"
                    >
                        <Eraser className="w-5 h-5" />
                        <ChevronDown className="w-3 h-3 opacity-50" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => { setTool('eraser'); setLineWidth(10); }}>
                        Small Eraser
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setTool('eraser'); setLineWidth(30); }}>
                        Medium Eraser
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setTool('eraser'); setLineWidth(50); }}>
                        Large Eraser
                    </DropdownMenuItem>
                </DropdownMenuContent>
             </DropdownMenu>
             <Button
                variant="ghost"
                size="icon"
                onClick={clearCanvas}
                title="Clear Canvas"
             >
                <Trash2 className="w-5 h-5" />
             </Button>
          </div>

          <div className="flex items-center gap-2">
             <Button
                variant="ghost"
                size="icon"
                onClick={undo}
                disabled={historyStep <= 0}
                title="Undo"
             >
                <Undo className="w-5 h-5" />
             </Button>
             <Button
                variant="ghost"
                size="icon"
                onClick={redo}
                disabled={historyStep >= history.length - 1}
                title="Redo"
             >
                <Redo className="w-5 h-5" />
             </Button>
          </div>
        </div>

        <div className="flex items-center gap-3">
             <Dialog>
                <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                        AI Comic
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Generate Comic from Diary</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto p-1">
                            {entries.filter(e => !e.deleted).map(entry => (
                                <div 
                                    key={entry.id}
                                    onClick={() => setSelectedEntryId(entry.id)}
                                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                                        selectedEntryId === entry.id 
                                        ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200' 
                                        : 'border-slate-200 hover:border-indigo-300'
                                    }`}
                                >
                                    <h4 className="font-medium text-slate-800 mb-1">{entry.title}</h4>
                                    <p className="text-sm text-slate-500 line-clamp-2">{entry.content}</p>
                                    <span className="text-xs text-slate-400 mt-2 block">{format(new Date(entry.date), 'yyyy-MM-dd')}</span>
                                </div>
                            ))}
                        </div>
                        
                        <div className="flex justify-end pt-4 border-t">
                            <Button 
                                onClick={generateComic} 
                                disabled={!selectedEntryId || isGenerating}
                                className="bg-indigo-600 hover:bg-indigo-700"
                            >
                                {isGenerating ? (
                                    <>
                                        <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        Generate 4-Panel Comic
                                    </>
                                )}
                            </Button>
                        </div>

                        {comicPanels.length > 0 && (
                            <div className="space-y-4 mt-6">
                                <div className="grid grid-cols-2 gap-2">
                                    {comicPanels.map((url, i) => (
                                        <div key={i} className="aspect-video bg-slate-100 rounded overflow-hidden relative group">
                                            <img src={url} alt={`Panel ${i+1}`} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <span className="text-white font-bold text-lg">Panel {i+1}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-end">
                                    <Button onClick={downloadComic} variant="outline" className="gap-2">
                                        <Download className="w-4 h-4" />
                                        Download Comic
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
             </Dialog>

             <Button onClick={downloadImage} className="gap-2">
                <Download className="w-4 h-4" />
                Download
             </Button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 bg-slate-100 p-8 overflow-hidden flex items-center justify-center">
        <div className="bg-white shadow-lg rounded-lg w-full h-full max-w-5xl max-h-[80vh] overflow-hidden relative">
            <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="cursor-crosshair touch-none"
            />
        </div>
      </div>
    </div>
  );
}
