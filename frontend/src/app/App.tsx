import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DiaryProvider, useDiary } from './contexts/DiaryContext';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { TimelinePage } from './pages/TimelinePage';
import { WritePage } from './pages/WritePage';
import { EntryDetailPage } from './pages/EntryDetailPage';
import { SearchPage } from './pages/SearchPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { TrashPage } from './pages/TrashPage';
import { SettingsPage } from './pages/SettingsPage';
import { CommunityPage } from './pages/CommunityPage';
import { TopicPage } from './pages/TopicPage';
import TypingTrainingPage from './pages/TypingTrainingPage';
import { BookshelfPage } from './pages/BookshelfPage';
import { BookReader } from './pages/BookReader';
import { MindMapPage } from './pages/MindMapPage';
import { MindMapEditor } from './pages/MindMapEditor';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useDiary();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <Layout>{children}</Layout>;
}

function AppRoutes() {
  const { user } = useDiary();

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/timeline" replace /> : <LoginPage />}
      />
      <Route
        path="/timeline"
        element={
          <ProtectedRoute>
            <TimelinePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/community"
        element={
          <ProtectedRoute>
            <CommunityPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/topic"
        element={
          <ProtectedRoute>
            <TopicPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/typeing-training"
        element={
          <ProtectedRoute>
            <TypingTrainingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bookshelf"
        element={
          <ProtectedRoute>
            <BookshelfPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/read/:id"
        element={
          <ProtectedRoute>
            <BookReader />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mindmap"
        element={
          <ProtectedRoute>
            <MindMapPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mindmap/:id"
        element={
          <ProtectedRoute>
            <MindMapEditor />
          </ProtectedRoute>
        }
      />
      <Route
        path="/write"
        element={
          <ProtectedRoute>
            <WritePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/write/:id"
        element={
          <ProtectedRoute>
            <WritePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/entry/:id"
        element={
          <ProtectedRoute>
            <EntryDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/search"
        element={
          <ProtectedRoute>
            <SearchPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <AnalyticsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/trash"
        element={
          <ProtectedRoute>
            <TrashPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/painting"
        element={
          <ProtectedRoute>
            <PaintingPage />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

import { ThemeProvider } from 'next-themes';
import { PaintingPage } from './pages/PaintingPage';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <DiaryProvider>
          <AppRoutes />
        </DiaryProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
