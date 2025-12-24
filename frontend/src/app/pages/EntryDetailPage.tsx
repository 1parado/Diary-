import { useParams, useNavigate } from 'react-router-dom';
import { useDiary } from '../contexts/DiaryContext';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, Edit, Trash2, Lock, Globe } from 'lucide-react';
import { format } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog';

export function EntryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getEntry, deleteEntry } = useDiary();

  const entry = id ? getEntry(id) : null;

  if (!entry || entry.deleted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl text-slate-700 mb-4">Entry not found</h2>
          <Button onClick={() => navigate('/timeline')}>
            Back to Timeline
          </Button>
        </div>
      </div>
    );
  }

  const handleDelete = () => {
    deleteEntry(entry.id);
    navigate('/timeline');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/timeline')}
            className="text-slate-600 hover:text-slate-800 mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Timeline
          </Button>

          <div className="bg-white border border-slate-200 rounded-lg p-8">
            {/* Header */}
            <div className="flex items-start justify-between mb-6 pb-6 border-b border-slate-200">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h1 className="text-3xl text-slate-800">{entry.title}</h1>
                  {entry.privacy === 'private' ? (
                    <Lock className="w-5 h-5 text-slate-400" />
                  ) : (
                    <Globe className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                <p className="text-slate-500">
                  {format(entry.date, 'EEEE, MMMM d, yyyy')}
                </p>
                {entry.updatedAt && (
                  <p className="text-sm text-slate-400 mt-1">
                    Last updated: {format(entry.updatedAt, 'MMMM d, yyyy h:mm a')}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/write/${entry.id}`)}
                  className="gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This entry will be moved to trash. You can restore it later or permanently delete it from there.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            {/* Tags and Mood */}
            <div className="flex flex-wrap gap-2 mb-8">
              {entry.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="bg-slate-100 text-slate-600">
                  {tag}
                </Badge>
              ))}
              {entry.mood && (
                <Badge variant="outline" className="border-indigo-200 text-indigo-600">
                  Mood: {entry.mood}
                </Badge>
              )}
            </div>

            {/* Content */}
            <div className="prose prose-slate max-w-none">
              <div className="text-lg leading-relaxed text-slate-700 whitespace-pre-wrap">
                {entry.content}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
