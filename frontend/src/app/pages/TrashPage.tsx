import { useDiary } from '../contexts/DiaryContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Trash2, RefreshCw, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog';

export function TrashPage() {
  const { entries, restoreEntry, permanentlyDeleteEntry } = useDiary();
  const navigate = useNavigate();

  const deletedEntries = entries.filter(entry => entry.deleted);

  const handleRestore = (id: string) => {
    restoreEntry(id);
  };

  const handlePermanentDelete = (id: string) => {
    permanentlyDeleteEntry(id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Trash2 className="w-8 h-8 text-slate-600" />
            <h1 className="text-3xl text-slate-800">Trash</h1>
          </div>
          <p className="text-slate-500">
            {deletedEntries.length} {deletedEntries.length === 1 ? 'entry' : 'entries'} in trash
          </p>
        </div>

        {deletedEntries.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 className="w-10 h-10 text-slate-400" />
            </div>
            <h2 className="text-xl text-slate-700 mb-2">Trash is empty</h2>
            <p className="text-slate-500 mb-6">Deleted entries will appear here</p>
            <Button onClick={() => navigate('/timeline')} variant="outline">
              Back to Timeline
            </Button>
          </div>
        ) : (
          <>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-yellow-800">
                  Entries in trash can be restored or permanently deleted. 
                  Once permanently deleted, they cannot be recovered.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {deletedEntries.map(entry => (
                <div
                  key={entry.id}
                  className="bg-white border border-slate-200 rounded-lg p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg text-slate-800 mb-2">{entry.title}</h3>
                      <p className="text-sm text-slate-500">
                        Deleted on {format(entry.updatedAt || entry.date, 'MMMM d, yyyy')}
                      </p>
                    </div>
                  </div>

                  <p className="text-slate-600 mb-4 line-clamp-2">
                    {entry.content}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {entry.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="bg-slate-100 text-slate-600">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestore(entry.id)}
                      className="gap-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Restore
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete Permanently
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Permanently delete this entry?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This entry will be permanently deleted 
                            from your diary and cannot be recovered.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handlePermanentDelete(entry.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete Permanently
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
