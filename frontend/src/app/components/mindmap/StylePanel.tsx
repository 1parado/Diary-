import React from 'react';
import { Edge, Node } from 'reactflow';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface StylePanelProps {
  selectedNode?: Node;
  selectedEdge?: Edge;
  onNodeUpdate: (id: string, data: any) => void;
  onEdgeUpdate: (id: string, style: any) => void;
}

export const StylePanel = ({ selectedNode, selectedEdge, onNodeUpdate, onEdgeUpdate }: StylePanelProps) => {
  if (!selectedNode && !selectedEdge) return null;

  return (
    <div className="absolute top-16 right-4 w-64 bg-white rounded-lg shadow-lg border p-4 z-20">
      <h3 className="font-semibold mb-3 text-sm text-gray-700">
        {selectedNode ? 'Node Style' : 'Edge Style'}
      </h3>

      {selectedNode && (
        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">Background Color</Label>
            <div className="flex gap-2">
              <Input 
                type="color" 
                value={selectedNode.data.color || '#ffffff'} 
                onChange={(e) => onNodeUpdate(selectedNode.id, { color: e.target.value })}
                className="w-8 h-8 p-0 border-0 rounded-full overflow-hidden"
              />
              <Input 
                type="text" 
                value={selectedNode.data.color || '#ffffff'} 
                onChange={(e) => onNodeUpdate(selectedNode.id, { color: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-gray-500">Text Color</Label>
            <div className="flex gap-2">
              <Input 
                type="color" 
                value={selectedNode.data.textColor || '#000000'} 
                onChange={(e) => onNodeUpdate(selectedNode.id, { textColor: e.target.value })}
                className="w-8 h-8 p-0 border-0 rounded-full overflow-hidden"
              />
              <Input 
                type="text" 
                value={selectedNode.data.textColor || '#000000'} 
                onChange={(e) => onNodeUpdate(selectedNode.id, { textColor: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-gray-500">Font Size</Label>
            <div className="flex items-center gap-2">
                <Input 
                    type="number" 
                    value={parseInt(selectedNode.data.fontSize || '14')} 
                    onChange={(e) => onNodeUpdate(selectedNode.id, { fontSize: `${e.target.value}px` })}
                    className="h-8 text-xs w-16"
                    min={8}
                    max={72}
                />
                <span className="text-xs text-gray-500">px</span>
                <Button 
                     variant={selectedNode.data.fontWeight === 'bold' ? 'default' : 'outline'}
                     size="sm"
                     className="h-8 w-8 p-0 ml-auto"
                     onClick={() => onNodeUpdate(selectedNode.id, { fontWeight: selectedNode.data.fontWeight === 'bold' ? '500' : 'bold' })}
                 >
                     B
                 </Button>
            </div>
          </div>
        </div>
      )}

      {selectedEdge && (
        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">Line Color</Label>
            <div className="flex gap-2">
              <Input 
                type="color" 
                value={selectedEdge.style?.stroke || '#b1b1b7'} 
                onChange={(e) => onEdgeUpdate(selectedEdge.id, { stroke: e.target.value })}
                className="w-8 h-8 p-0 border-0 rounded-full overflow-hidden"
              />
              <Input 
                type="text" 
                value={selectedEdge.style?.stroke || '#b1b1b7'} 
                onChange={(e) => onEdgeUpdate(selectedEdge.id, { stroke: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-gray-500">Stroke Width</Label>
             <div className="flex items-center gap-2">
                <Input 
                    type="number" 
                    value={parseInt(selectedEdge.style?.strokeWidth as string || '1')} 
                    onChange={(e) => onEdgeUpdate(selectedEdge.id, { strokeWidth: parseInt(e.target.value) })}
                    className="h-8 text-xs"
                    min={1}
                    max={20}
                />
                <span className="text-xs text-gray-500">px</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
