import React, { useEffect } from 'react';
import { Node } from 'reactflow';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '../../components/ui/context-menu';
import { Copy, Trash2, Plus, Scissors, Clipboard } from 'lucide-react';

interface MindMapContextMenuProps {
  children: React.ReactNode;
  onAddSibling: () => void;
  onAddChild: () => void;
  onDelete: () => void;
  onCopy: () => void;
  onCut: () => void;
  onPaste: () => void;
  hasSelection: boolean;
  hasClipboard: boolean;
}

export const MindMapContextMenu = ({
  children,
  onAddSibling,
  onAddChild,
  onDelete,
  onCopy,
  onCut,
  onPaste,
  hasSelection,
  hasClipboard
}: MindMapContextMenuProps) => {
  return (
    <ContextMenu>
      <ContextMenuTrigger className="w-full h-full">
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        <ContextMenuItem onClick={onAddSibling} disabled={!hasSelection}>
          <Plus className="w-4 h-4 mr-2" /> Add Sibling Node
          <span className="ml-auto text-xs text-gray-400">Enter</span>
        </ContextMenuItem>
        <ContextMenuItem onClick={onAddChild} disabled={!hasSelection}>
          <Plus className="w-4 h-4 mr-2" /> Add Child Node
          <span className="ml-auto text-xs text-gray-400">Tab</span>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onCopy} disabled={!hasSelection}>
          <Copy className="w-4 h-4 mr-2" /> Copy
          <span className="ml-auto text-xs text-gray-400">Ctrl+C</span>
        </ContextMenuItem>
        <ContextMenuItem onClick={onCut} disabled={!hasSelection}>
          <Scissors className="w-4 h-4 mr-2" /> Cut
          <span className="ml-auto text-xs text-gray-400">Ctrl+X</span>
        </ContextMenuItem>
        <ContextMenuItem onClick={onPaste} disabled={!hasClipboard}>
          <Clipboard className="w-4 h-4 mr-2" /> Paste
          <span className="ml-auto text-xs text-gray-400">Ctrl+V</span>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onDelete} disabled={!hasSelection} className="text-red-600">
          <Trash2 className="w-4 h-4 mr-2" /> Delete
          <span className="ml-auto text-xs text-red-300">Del</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};
