import { useDiary } from '../contexts/DiaryContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { PlusCircle, Lock, BookOpen, LayoutGrid, LayoutList, Folder, Trash2, FolderPlus } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Draggable Entry Wrapper
const DraggableEntry = ({ entry, children }: { entry: any, children: React.ReactNode }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'ENTRY',
    item: { id: entry.id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  // Use a callback ref to properly attach the drag source
  return (
    <div ref={drag} style={{ opacity: isDragging ? 0.5 : 1, cursor: 'grab' }}>
      {children}
    </div>
  );
};

// Droppable Folder Component
const FolderDropZone = ({ 
  name, 
  onDrop, 
  isSelected, 
  onClick, 
  onDelete 
}: { 
  name: string, 
  onDrop: (id: string, folder: string) => void, 
  isSelected: boolean, 
  onClick: () => void,
  onDelete?: () => void
}) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'ENTRY',
    drop: (item: { id: string }) => onDrop(item.id, name),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  return (
    <div 
      ref={drop} 
      onClick={onClick}
      className={`group p-3 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
        isSelected ? 'bg-indigo-100 text-indigo-700 font-medium' : 
        isOver ? 'bg-indigo-50 text-indigo-600 border-2 border-dashed border-indigo-300' : 'hover:bg-slate-100 text-slate-600'
      }`}
    >
      <div className="flex items-center gap-2">
        <Folder className={`w-4 h-4 ${isSelected ? 'text-indigo-700' : 'text-slate-400'}`} />
        <span>{name}</span>
      </div>
      {onDelete && (
        <button 
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1 rounded hover:bg-red-100 hover:text-red-500 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Delete Folder"
        >
            <Trash2 className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

export function TimelinePage() {
  const { entries, folders, createFolder, deleteFolder, moveEntryToFolder } = useDiary();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null); // null means All
  const [newFolderName, setNewFolderName] = useState('');
  
  const activeEntries = entries.filter(entry => !entry.deleted);
  
  const filteredEntries = selectedFolderId 
    ? activeEntries.filter(e => e.folderId === selectedFolderId)
    : activeEntries;

  const groupedEntries = filteredEntries.reduce((groups, entry) => {
    const date = format(entry.date, 'MMMM yyyy');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(entry);
    return groups;
  }, {} as Record<string, typeof filteredEntries>);

  const getPreview = (content: string) => {
    return content.length > 150 ? content.substring(0, 150) + '...' : content;
  };

  const moodConfig: Record<string, { emoji: string, color: string, bg: string }> = {
    happy: { emoji: '😊', color: 'text-amber-600', bg: 'bg-amber-100' },
    grateful: { emoji: '🙏', color: 'text-emerald-600', bg: 'bg-emerald-100' },
    peaceful: { emoji: '😌', color: 'text-blue-600', bg: 'bg-blue-100' },
    excited: { emoji: '🤩', color: 'text-purple-600', bg: 'bg-purple-100' },
    reflective: { emoji: '🤔', color: 'text-indigo-600', bg: 'bg-indigo-100' },
    anxious: { emoji: '😰', color: 'text-orange-600', bg: 'bg-orange-100' },
    sad: { emoji: '😢', color: 'text-slate-600', bg: 'bg-slate-200' },
    neutral: { emoji: '😐', color: 'text-gray-600', bg: 'bg-gray-100' },
  };

  const getMoodStyle = (mood: string) => {
    const config = moodConfig[mood.toLowerCase()] || { emoji: '😶', color: 'text-slate-600', bg: 'bg-slate-100' };
    return config;
  };

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      createFolder(newFolderName.trim());
      setNewFolderName('');
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-slate-200 p-6 hidden md:block flex-shrink-0 h-screen sticky top-0 overflow-y-auto">
            <h2 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
                <Folder className="w-5 h-5 text-indigo-600" />
                Folders
            </h2>
            
            <div className="space-y-2 mb-8">
                <div 
                    onClick={() => setSelectedFolderId(null)}
                    className={`p-3 rounded-lg flex items-center gap-2 cursor-pointer transition-colors ${
                        selectedFolderId === null ? 'bg-indigo-100 text-indigo-700 font-medium' : 'hover:bg-slate-100 text-slate-600'
                    }`}
                >
                    <LayoutGrid className={`w-4 h-4 ${selectedFolderId === null ? 'text-indigo-700' : 'text-slate-400'}`} />
                    <span>All Entries</span>
                </div>
                
                {folders.map(folder => (
                    <FolderDropZone
                        key={folder.id}
                        name={folder.name}
                        isSelected={selectedFolderId === folder.id}
                        onClick={() => setSelectedFolderId(folder.id)}
                        onDrop={(entryId) => moveEntryToFolder(entryId, folder.id)}
                        onDelete={() => {
                            if (window.confirm(`Delete folder "${folder.name}"? Entries will be kept but unassigned.`)) {
                                deleteFolder(folder.id);
                                if (selectedFolderId === folder.id) setSelectedFolderId(null);
                            }
                        }}
                    />
                ))}
            </div>

            <form onSubmit={handleCreateFolder} className="mt-4">
                <div className="flex items-center gap-2">
                    <Input
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder="New Folder"
                        className="h-9 text-sm"
                    />
                    <Button type="submit" size="icon" variant="ghost" className="h-9 w-9 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                        <PlusCircle className="w-5 h-5" />
                    </Button>
                </div>
            </form>
        </div>

      <div className="flex-1 min-w-0">
      <div className={`${viewMode === 'grid' ? 'max-w-7xl' : 'max-w-4xl'} mx-auto px-4 py-8 transition-all duration-300`}>
        
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-3xl text-slate-800 mb-2">
                {selectedFolderId ? folders.find(f => f.id === selectedFolderId)?.name : 'My Diary'}
            </h1>
            <p className="text-slate-500">{filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'}</p>
          </div>
          <div className="flex gap-4">
            <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
              <Button
                variant={viewMode === 'list' ? 'white' : 'ghost'}
                size="icon"
                className={`h-8 w-8 ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-slate-500'}`}
                onClick={() => setViewMode('list')}
              >
                <LayoutList className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'white' : 'ghost'}
                size="icon"
                className={`h-8 w-8 ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-slate-500'}`}
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
            </div>
            <Button
              onClick={() => navigate('/write')}
              className="bg-indigo-600 hover:bg-indigo-700 gap-2"
            >
              <PlusCircle className="w-5 h-5" />
              Write New Entry
            </Button>
          </div>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
              <BookOpen className="w-10 h-10 text-slate-400" />
            </div>
            <h2 className="text-xl text-slate-700 mb-2">No entries found</h2>
            <p className="text-slate-500 mb-6">
                {selectedFolderId ? `No entries in "${folders.find(f => f.id === selectedFolderId)?.name}"` : "Start your journey by writing your first diary entry"}
            </p>
            <Button
              onClick={() => navigate('/write')}
              className="bg-indigo-600 hover:bg-indigo-700 gap-2"
            >
              <PlusCircle className="w-5 h-5" />
              Write New Entry
            </Button>
          </div>
        ) : (
          <div className="space-y-12">
            {Object.entries(groupedEntries).map(([monthYear, monthEntries]) => (
              <div key={monthYear}>
                <h2 className="text-lg text-slate-600 mb-6 border-b border-slate-200 pb-2">
                  {monthYear}
                </h2>
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-6'}>
                  {monthEntries.map(entry => (
                    <DraggableEntry key={entry.id} entry={entry}>
                    <div
                      onClick={() => navigate(`/entry/${entry.id}`)}
                      className="group bg-white border border-slate-200 rounded-lg p-6 hover:shadow-lg hover:border-indigo-200 transition-all cursor-pointer h-full"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg text-slate-800 group-hover:text-indigo-600 transition-colors">
                              {entry.title}
                            </h3>
                            {entry.privacy === 'private' && (
                              <Lock className="w-3 h-3 text-slate-400" />
                            )}
                            {entry.folderId && folders.find(f => f.id === entry.folderId) && (
                                <Badge variant="secondary" className="text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100">
                                    {folders.find(f => f.id === entry.folderId)?.name}
                                </Badge>
                            )}
                          </div>
                          <div className="text-sm text-slate-500 mb-4">
                            {format(new Date(entry.date), 'EEEE, d')}
                          </div>
                        </div>
                        {entry.mood && (
                          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getMoodStyle(entry.mood).bg} ${getMoodStyle(entry.mood).color}`} title={`Mood: ${entry.mood}`}>
                            <span className="text-sm">{getMoodStyle(entry.mood).emoji}</span>
                            <span className="capitalize">{entry.mood}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="prose prose-sm max-w-none text-slate-600 mb-4 line-clamp-3">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({node, ...props}) => <p className="mb-2" {...props} />,
                            a: ({node, ...props}) => <span className="text-indigo-600" {...props} />,
                          }}
                        >
                          {getPreview(entry.content)}
                        </ReactMarkdown>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-auto">
                        {entry.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="bg-slate-100 text-slate-600">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    </DraggableEntry>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
    </DndProvider>
  );
}
