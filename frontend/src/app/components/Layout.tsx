import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDiary } from '../contexts/DiaryContext';
import { Button } from './ui/button';
import { BookOpen, Home, Search, BarChart3, Trash2, Settings, LogOut, PenSquare, Users, PanelLeftClose, PanelLeftOpen, Sparkles, Keyboard, Palette, Layers } from 'lucide-react';
import { Toaster } from './ui/sonner';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useDiary();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/timeline', icon: Home, label: 'Timeline' },
    { path: '/search', icon: Search, label: 'Search' },
    { path: '/topic', icon: Sparkles, label: 'Daily Topic' },
    { path: '/bookshelf', icon: BookOpen, label: 'Bookshelf' },
    { path: '/community', icon: Users, label: 'Community' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/trash', icon: Trash2, label: 'Trash' },
    { path: '/typeing-training', icon: Keyboard, label: 'Typeing Training' },
    { path: '/painting', icon: Palette, label: 'Painting' },
    { path: '/mindmap', icon: Layers, label: 'MindMap' },
    { path: '/settings', icon: Settings, label: 'Settings' },
    
  ];

  return (
    <div className="min-h-screen bg-slate-50 relative">
      <Toaster />
      
      {/* Sidebar Toggle Button (When closed) */}
      <div className={`fixed left-4 top-4 z-50 transition-opacity duration-300 ${isSidebarOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <Button
          variant="outline"
          size="icon"
          className="bg-white shadow-sm"
          onClick={() => setIsSidebarOpen(true)}
        >
          <PanelLeftOpen className="w-5 h-5 text-slate-600" />
        </Button>
      </div>

      {/* Sidebar */}
      <aside 
        className={`fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 z-40 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 flex items-center justify-between">
          <Link to="/timeline" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg text-slate-800">Private Diary</h1>
              <p className="text-sm text-slate-500">{user?.name}</p>
            </div>
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-slate-400 hover:text-slate-600 -mr-2"
            onClick={() => setIsSidebarOpen(false)}
          >
            <PanelLeftClose className="w-5 h-5" />
          </Button>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          <Button
            onClick={() => navigate('/write')}
            className="w-full justify-start gap-3 bg-indigo-600 hover:bg-indigo-700 mb-4"
          >
            <PenSquare className="w-5 h-5" />
            Write New Entry
          </Button>

          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={`w-full justify-start gap-3 ${
                    isActive ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100' : 'text-slate-600'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-200">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-slate-600"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            Log Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`transition-[margin] duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        {children}
      </main>
    </div>
  );
}
