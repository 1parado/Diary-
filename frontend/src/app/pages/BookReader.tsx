import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ReactReader } from 'react-reader';
import { Document, Page, pdfjs } from 'react-pdf';
import { useDiary } from '../contexts/DiaryContext';
import { ArrowLeft, Loader2, StickyNote, PlusCircle, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../components/ui/sheet';
import { toast } from 'sonner';

// Set worker URL for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export function BookReader() {
  const { id } = useParams<{ id: string }>();
  const { user } = useDiary();
  const navigate = useNavigate();
  const [location, setLocation] = useState<string | number>(0);
  const [book, setBook] = useState<any>(null);
  const [bookUrl, setBookUrl] = useState<string | null>(null);
  const [selections, setSelections] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const renditionRef = useRef<any>(null);
  const [tempSelection, setTempSelection] = useState<{ cfiRange: string; content: string; type: 'epub' | 'pdf' } | null>(null);
  
  // PDF state
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);

  useEffect(() => {
    if (id && user) {
      fetchBook();
      fetchNotes();
    }
    return () => {
      if (bookUrl) URL.revokeObjectURL(bookUrl);
    };
  }, [id, user]);

  // Re-apply highlights when selections change (only for EPUB)
  useEffect(() => {
    if (renditionRef.current && selections.length > 0 && book?.format !== 'pdf') {
        selections.forEach(sel => {
            try {
                renditionRef.current.annotations.add('highlight', sel.cfiRange, {}, undefined, 'hl');
            } catch (e) {
                // Ignore duplicate errors
            }
        });
    }
  }, [selections, book]);

  const fetchBook = async () => {
    try {
      // Fetch metadata
      const metaRes = await fetch(`http://localhost:8080/api/books/${id}`);
      const metaData = await metaRes.json();
      if (metaData.code === 200) {
        setBook(metaData.data);
        if (metaData.data.progress) {
          if (metaData.data.format === 'pdf') {
            setPageNumber(parseInt(metaData.data.progress) || 1);
          } else {
            setLocation(metaData.data.progress);
          }
        }
      }

      // Fetch file
      const fileRes = await fetch(`http://localhost:8080/api/books/${id}/download`);
      if (fileRes.ok) {
        const blob = await fileRes.blob();
        const url = URL.createObjectURL(blob);
        setBookUrl(url);
      } else {
        throw new Error(`Failed to download book: ${fileRes.statusText}`);
      }
    } catch (error: any) {
      console.error('Error loading book', error);
      setError(error.message || 'Failed to load book');
    }
  };

  const fetchNotes = async () => {
    if (!user || !id) return;
    try {
        const res = await fetch(`http://localhost:8080/api/books/${id}/notes?userId=${user.id}`);
        const data = await res.json();
        if (data.code === 200) {
            setSelections(data.data.map((note: any) => ({
                cfiRange: note.cfiRange,
                content: note.content,
                color: note.color || 'rgba(255, 255, 0, 0.3)',
                id: note.id
            })));
        }
    } catch (e) {
        console.error("Failed to fetch notes", e);
    }
  }

  const handleLocationChanged = (cfi: string | number) => {
    setLocation(cfi);
    if (typeof cfi === 'string' && id) {
       fetch(`http://localhost:8080/api/books/${id}/progress?progress=${encodeURIComponent(cfi)}`, {
           method: 'PUT'
       });
    }
  };
  
  const handlePdfPageChange = (newPage: number) => {
    setPageNumber(newPage);
    if (id) {
       fetch(`http://localhost:8080/api/books/${id}/progress?progress=${newPage}`, {
           method: 'PUT'
       });
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const handleSelection = async () => {
      if (!user || !id || !tempSelection) return;
      
      const note = {
          userId: user.id,
          bookId: id,
          cfiRange: tempSelection.cfiRange,
          content: tempSelection.content,
          color: 'rgba(255, 255, 0, 0.3)'
      };

      try {
          const res = await fetch(`http://localhost:8080/api/books/${id}/notes`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(note)
          });
          const data = await res.json();
          if (data.code === 200) {
              toast.success('Highlight saved');
              fetchNotes();
              setTempSelection(null);
              // Clear selection in EPUB
              if (tempSelection.type === 'epub' && renditionRef.current) {
                  const selection = renditionRef.current.getContents()[0].window.getSelection();
                  selection.removeAllRanges();
              }
              // Clear selection in PDF
              window.getSelection()?.removeAllRanges();
          }
      } catch (e) {
          toast.error('Failed to save highlight');
      }
  };

  const handleDeleteNote = async (noteId: string) => {
      try {
          const res = await fetch(`http://localhost:8080/api/books/notes/${noteId}`, {
              method: 'DELETE'
          });
          const data = await res.json();
          if (data.code === 200) {
              toast.success('Note deleted');
              fetchNotes();
              // Remove highlight from view if it's EPUB
              if (book?.format !== 'pdf' && renditionRef.current) {
                   const note = selections.find(s => s.id === noteId);
                   if (note) {
                       renditionRef.current.annotations.remove(note.cfiRange, 'highlight');
                   }
              }
          }
      } catch (e) {
          toast.error('Failed to delete note');
      }
  };
  
  const handlePdfMouseUp = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim().length > 0) {
          setTempSelection({
              content: selection.toString(),
              cfiRange: `page=${pageNumber}`, 
              type: 'pdf'
          });
      } else {
          // Only clear if clicking outside and not on the "Add Note" button
          // This part is tricky, we'll let the button click handler handle clearing if needed
          // or just rely on the user clicking "Add"
      }
  };
  
  const addToDiary = (content: string) => {
      const citation = `> ${content}\n> -- 《${book?.title}》`;
      localStorage.setItem('diary_initial_content', citation);
      navigate('/write');
  };

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-4">
        <div className="text-red-500 mb-4 font-medium">Error: {error}</div>
        <p className="text-sm text-gray-500 mb-4">Please try deleting and re-uploading the book if the error persists.</p>
        <Button variant="outline" onClick={() => navigate('/bookshelf')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Return to Bookshelf
        </Button>
      </div>
    );
  }

  if (!bookUrl) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="h-12 border-b flex items-center px-4 bg-white shadow-sm z-10 justify-between">
        <div className="flex items-center">
            <Button variant="ghost" size="sm" onClick={() => navigate('/bookshelf')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <span className="font-medium ml-4">{book?.title}</span>
        </div>
        
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                    <StickyNote className="w-4 h-4 mr-2" /> Notes
                </Button>
            </SheetTrigger>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Book Notes</SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-4 h-[calc(100vh-150px)] overflow-y-auto pr-2">
                    {selections.map((note, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 rounded border text-sm relative group">
                            <p className="mb-2 italic">"{note.content}"</p>
                            <div className="flex gap-2">
                                <Button size="sm" variant="secondary" className="flex-1" onClick={() => addToDiary(note.content)}>
                                    <PlusCircle className="w-3 h-3 mr-2" /> Add to Diary
                                </Button>
                                <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => handleDeleteNote(note.id)}>
                                    <Trash2 className="w-3 h-3" />
                                </Button>
                            </div>
                        </div>
                    ))}
                    {selections.length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-4">No notes yet.</p>
                    )}
                </div>
            </SheetContent>
        </Sheet>
      </div>
      <div className="flex-1 relative bg-gray-100 overflow-hidden">
        {tempSelection && (
            <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 fade-in duration-200">
                <Button onClick={handleSelection} className="shadow-lg">
                    <StickyNote className="w-4 h-4 mr-2" />
                    Add to Book Notes
                </Button>
            </div>
        )}
        {book?.format === 'pdf' ? (
            <div className="flex flex-col items-center h-full overflow-auto pt-4 pb-20" onMouseUp={handlePdfMouseUp}>
                <Document file={bookUrl} onLoadSuccess={onDocumentLoadSuccess} className="shadow-lg">
                    <Page pageNumber={pageNumber} width={Math.min(window.innerWidth * 0.9, 800)} renderTextLayer={false} renderAnnotationLayer={false} />
                </Document>
                
                {numPages && (
                    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-full shadow-lg px-4 py-2 flex items-center gap-4 z-20">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            disabled={pageNumber <= 1} 
                            onClick={() => handlePdfPageChange(pageNumber - 1)}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-sm font-medium">
                            {pageNumber} / {numPages}
                        </span>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            disabled={pageNumber >= numPages} 
                            onClick={() => handlePdfPageChange(pageNumber + 1)}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                )}
            </div>
        ) : (
            <ReactReader
              url={bookUrl}
              location={location}
              locationChanged={handleLocationChanged}
              getRendition={(rendition) => {
              renditionRef.current = rendition;
              rendition.on('selected', (cfiRange: string, contents: any) => {
                  const text = rendition.getRange(cfiRange).toString();
                  setTempSelection({
                      content: text,
                      cfiRange: cfiRange,
                      type: 'epub'
                  });
                  // Keep selection visible so user knows what they are adding
              });
              // Initial load highlights
              selections.forEach(sel => {
                  try {
                      rendition.annotations.add('highlight', sel.cfiRange, {}, undefined, 'hl');
                  } catch(e) {}
              });
          }}
        />
        )}
      </div>
    </div>
  );
}


