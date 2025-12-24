import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDiary } from '../contexts/DiaryContext';
import { Plus, Trash2, Layers, MoreVertical, LayoutList, Grid3x3, Search, Filter, Calendar, Tag } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { format, isAfter, subDays, subWeeks } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

interface MindMap {
  id: string;
  title: string;
  updatedAt: string;
  nodeCount?: number;
  edgeCount?: number;
}

export function MindMapPage() {
  const { user } = useDiary();
  const navigate = useNavigate();
  const [mindMaps, setMindMaps] = useState<MindMap[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  
  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'all' | 'title' | 'tag'>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | '1day' | '1week'>('all');

  useEffect(() => {
    if (user) {
      fetchMindMaps();
    }
  }, [user]);

  const fetchMindMaps = async () => {
    try {
      const res = await fetch(`http://localhost:8080/api/mindmaps?userId=${user?.id}`);
      const data = await res.json();
      if (data.code === 200) {
        // 计算节点和边的数量
        const enrichedData = data.data.map((map: any) => {
          let nodeCount = 0;
          let edgeCount = 0;
          
          try {
            if (map.content) {
              const content = JSON.parse(map.content);
              nodeCount = content.nodes?.length || 0;
              edgeCount = content.edges?.length || 0;
            }
          } catch (e) {
            console.error('Failed to parse mindmap content:', e);
          }
          
          return {
            ...map,
            nodeCount,
            edgeCount
          };
        });
        
        setMindMaps(enrichedData);
      }
    } catch (error) {
      console.error('Failed to fetch mind maps', error);
    }
  };

  const filteredMindMaps = useMemo(() => {
    return mindMaps.filter(map => {
      // 1. Time Filter
      let matchesTime = true;
      const mapDate = new Date(map.updatedAt);
      if (timeFilter === '1day') {
        matchesTime = isAfter(mapDate, subDays(new Date(), 1));
      } else if (timeFilter === '1week') {
        matchesTime = isAfter(mapDate, subWeeks(new Date(), 1));
      }

      // 2. Search Filter
      let matchesSearch = true;
      const query = searchQuery.toLowerCase().trim();
      
      if (query) {
        if (searchType === 'title') {
          matchesSearch = map.title.toLowerCase().includes(query);
        } else if (searchType === 'tag') {
          // Assuming tags might be in content or a separate field
          matchesSearch = false; // Implement tag search logic when tags are available
        } else {
          // 'all' searches title and maybe content
          matchesSearch = map.title.toLowerCase().includes(query);
        }
      }

      return matchesTime && matchesSearch;
    });
  }, [mindMaps, searchQuery, searchType, timeFilter]);

  const handleCreate = async () => {
    if (!newTitle.trim()) {
      toast.error('Please enter a title');
      return;
    }

    try {
      const initialContent = JSON.stringify({
        nodes: [{ id: '1', type: 'input', data: { label: 'Root Node' }, position: { x: 250, y: 25 } }],
        edges: []
      });

      const res = await fetch('http://localhost:8080/api/mindmaps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          title: newTitle,
          content: initialContent
        })
      });

      const data = await res.json();
      if (data.code === 200) {
        toast.success('Mind map created');
        setNewTitle('');
        setIsCreating(false);
        fetchMindMaps();
        navigate(`/mindmap/${data.data.id}`);
      }
    } catch (error) {
      toast.error('Failed to create mind map');
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this mind map?')) return;

    try {
      const res = await fetch(`http://localhost:8080/api/mindmaps/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.code === 200) {
        toast.success('Mind map deleted');
        fetchMindMaps();
      }
    } catch (error) {
      toast.error('Failed to delete mind map');
    }
  };

  // 列表视图组件
  const MindMapListItem = ({ map }: { map: MindMap }) => (
    <div
      key={map.id}
      onClick={() => navigate(`/mindmap/${map.id}`)}
      className="group bg-white p-6 rounded-lg border shadow-sm hover:shadow-md transition-all cursor-pointer relative"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
            <Layers className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1 truncate">{map.title}</h3>
            <p className="text-sm text-gray-500">
              Updated {format(new Date(map.updatedAt), 'MMM d, yyyy')}
            </p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="text-red-600" onClick={(e) => handleDelete(map.id, e)}>
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
          {map.nodeCount || 0} nodes
        </span>
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          {map.edgeCount || 0} connections
        </span>
      </div>
    </div>
  );

  // 网格视图组件
  const MindMapGridItem = ({ map }: { map: MindMap }) => (
    <div
      key={map.id}
      onClick={() => navigate(`/mindmap/${map.id}`)}
      className="group bg-white p-4 rounded-lg border shadow-sm hover:shadow-md transition-all cursor-pointer relative"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
          <Layers className="w-5 h-5" />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="text-red-600" onClick={(e) => handleDelete(map.id, e)}>
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <h3 className="font-semibold text-base mb-2 truncate line-clamp-2">{map.title}</h3>
      <p className="text-xs text-gray-500 mb-3">
        Updated {format(new Date(map.updatedAt), 'MMM d, yyyy')}
      </p>
      
      <div className="flex items-center justify-between text-xs text-gray-600">
        <span className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
          {map.nodeCount || 0}
        </span>
        <span className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
          {map.edgeCount || 0}
        </span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className={`${viewMode === 'grid' ? 'max-w-7xl' : 'max-w-3xl'} mx-auto px-4 py-8 transition-all duration-300`}>
        <div className="mb-8">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h1 className="text-3xl text-slate-800 mb-2">Mind Maps</h1>
              <p className="text-slate-500">Organize your thoughts visually</p>
            </div>
            <div className="flex gap-2 items-center">
              <Button onClick={() => setIsCreating(true)} disabled={isCreating}>
                <Plus className="w-4 h-4 mr-2" /> New Mind Map
              </Button>
              <div className="flex gap-1 bg-slate-100 p-1 rounded-lg ml-2">
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
                  <Grid3x3 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4 md:space-y-0 md:flex md:items-center md:gap-4">
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  placeholder="Search mind maps..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </div>

        {isCreating && (
          <div className="mb-6 p-4 bg-white rounded-lg shadow border animate-in fade-in slide-in-from-top-4">
            <h3 className="font-medium mb-3">Create New Mind Map</h3>
            <div className="flex gap-2">
              <Input
                placeholder="Enter title..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
              <Button onClick={handleCreate}>Create</Button>
              <Button variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
            </div>
          </div>
        )}

        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {filteredMindMaps.map(map => 
            viewMode === 'list' 
              ? <MindMapListItem key={map.id} map={map} />
              : <MindMapGridItem key={map.id} map={map} />
          )}

          {filteredMindMaps.length === 0 && !isCreating && (
            <div className={`text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200 ${
              viewMode === 'grid' ? 'col-span-full' : ''
            }`}>
              <div className="flex justify-center mb-4">
                {searchQuery || timeFilter !== 'all' ? (
                  <Search className="w-12 h-12 text-slate-300" />
                ) : (
                  <Layers className="w-12 h-12 text-slate-300" />
                )}
              </div>
              <p className="text-lg font-medium text-slate-600">
                {searchQuery || timeFilter !== 'all' 
                  ? 'No mind maps found' 
                  : 'No mind maps yet'
                }
              </p>
              <p className="text-sm text-slate-400 mt-1">
                {searchQuery || timeFilter !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'Create one to get started!'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
