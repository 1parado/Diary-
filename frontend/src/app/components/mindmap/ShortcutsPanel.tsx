import React, { useState } from 'react';
import { Keyboard, X } from 'lucide-react';
import { Button } from '../ui/button';

export const ShortcutsPanel = () => {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="absolute top-4 left-4 z-20 bg-white/90 backdrop-blur"
        onClick={() => setIsOpen(true)}
      >
        <Keyboard className="w-4 h-4 mr-2" /> Shortcuts
      </Button>
    );
  }

  return (
    <div className="absolute top-4 left-4 z-20 w-80 bg-white/95 backdrop-blur shadow-lg border rounded-lg overflow-hidden animate-in slide-in-from-left-2 fade-in">
      <div className="flex items-center justify-between p-3 border-b bg-gray-50/50">
        <h3 className="font-medium flex items-center gap-2">
          <Keyboard className="w-4 h-4" /> Keyboard Shortcuts
        </h3>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsOpen(false)}>
          <X className="w-3 h-3" />
        </Button>
      </div>
      <div className="p-3 text-sm space-y-2 max-h-[60vh] overflow-y-auto">
        <div className="grid grid-cols-[1fr,auto] gap-2 items-center">
          <span className="text-gray-600">Add Sibling Node</span>
          <kbd className="px-2 py-0.5 bg-gray-100 border rounded text-xs font-mono">Enter</kbd>
        </div>
        <div className="grid grid-cols-[1fr,auto] gap-2 items-center">
          <span className="text-gray-600">Add Child Node</span>
          <kbd className="px-2 py-0.5 bg-gray-100 border rounded text-xs font-mono">Tab</kbd>
        </div>
        <div className="grid grid-cols-[1fr,auto] gap-2 items-center">
          <span className="text-gray-600">Add Parent Node</span>
          <kbd className="px-2 py-0.5 bg-gray-100 border rounded text-xs font-mono">Ctrl+Shift+Enter</kbd>
        </div>
         <div className="grid grid-cols-[1fr,auto] gap-2 items-center">
          <span className="text-gray-600">Insert Node Above</span>
          <kbd className="px-2 py-0.5 bg-gray-100 border rounded text-xs font-mono">Shift+Enter</kbd>
        </div>
        <div className="grid grid-cols-[1fr,auto] gap-2 items-center">
          <span className="text-gray-600">Delete Node</span>
          <kbd className="px-2 py-0.5 bg-gray-100 border rounded text-xs font-mono">Del / Backspace</kbd>
        </div>
        <div className="grid grid-cols-[1fr,auto] gap-2 items-center">
          <span className="text-gray-600">Edit Node Text</span>
          <kbd className="px-2 py-0.5 bg-gray-100 border rounded text-xs font-mono">Double Click</kbd>
        </div>
        <div className="grid grid-cols-[1fr,auto] gap-2 items-center">
          <span className="text-gray-600">Move Node</span>
          <kbd className="px-2 py-0.5 bg-gray-100 border rounded text-xs font-mono">Arrow Keys</kbd>
        </div>
         <div className="grid grid-cols-[1fr,auto] gap-2 items-center">
          <span className="text-gray-600">Copy</span>
          <kbd className="px-2 py-0.5 bg-gray-100 border rounded text-xs font-mono">Ctrl+C</kbd>
        </div>
         <div className="grid grid-cols-[1fr,auto] gap-2 items-center">
          <span className="text-gray-600">Paste</span>
          <kbd className="px-2 py-0.5 bg-gray-100 border rounded text-xs font-mono">Ctrl+V</kbd>
        </div>
        <div className="grid grid-cols-[1fr,auto] gap-2 items-center">
          <span className="text-gray-600">Undo</span>
          <kbd className="px-2 py-0.5 bg-gray-100 border rounded text-xs font-mono">Ctrl+Z</kbd>
        </div>
        <div className="grid grid-cols-[1fr,auto] gap-2 items-center">
          <span className="text-gray-600">Redo</span>
          <kbd className="px-2 py-0.5 bg-gray-100 border rounded text-xs font-mono">Ctrl+Y</kbd>
        </div>
        <div className="grid grid-cols-[1fr,auto] gap-2 items-center">
          <span className="text-gray-600">Save</span>
          <kbd className="px-2 py-0.5 bg-gray-100 border rounded text-xs font-mono">Ctrl+S</kbd>
        </div>
      </div>
    </div>
  );
};
