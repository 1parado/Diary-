import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDiary } from '../contexts/DiaryContext';
import { Plus, Book as BookIcon, Trash2, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardFooter } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { toast } from 'sonner';

interface Book {
  id: string;
  title: string;
  author: string;
  coverImage?: string;
  progress?: string;
  lastReadAt?: string;
}

export function BookshelfPage() {
  const { user } = useDiary();
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookAuthor, setNewBookAuthor] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (user) {
      fetchBooks();
    }
  }, [user]);

  const fetchBooks = async () => {
    try {
      const res = await fetch(`http://localhost:8080/api/books?userId=${user?.id}`);
      const data = await res.json();
      if (data.code === 200) {
        setBooks(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch books', error);
      toast.error('Failed to load bookshelf');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Auto-fill title from filename
      setNewBookTitle(file.name.replace('.epub', ''));
    } else {
      setSelectedFile(null);
    }
  };

  const handleUpload = async () => {
    if (!user) {
        toast.error('User not authenticated');
        return;
    }
    
    if (!selectedFile) {
        toast.error('Please select an EPUB file');
        return;
    }
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append('userId', user.id.toString());
    formData.append('title', newBookTitle);
    formData.append('author', newBookAuthor || 'Unknown');
    formData.append('file', selectedFile);

    try {
      const res = await fetch('http://localhost:8080/api/books', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.code === 200) {
        toast.success('Book uploaded successfully');
        setIsDialogOpen(false);
        fetchBooks();
        setNewBookTitle('');
        setNewBookAuthor('');
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        toast.error('Upload failed: ' + data.msg);
      }
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this book?')) return;
    
    try {
      const res = await fetch(`http://localhost:8080/api/books/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.code === 200) {
        toast.success('Book deleted');
        setBooks(books.filter(b => b.id !== id));
      }
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-3xl font-bold mb-2">My Bookshelf</h1>
            <p className="text-muted-foreground">Manage and read your collection</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" /> Add Book
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Book (EPUB)</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>EPUB File</Label>
                <Input 
                  type="file" 
                  accept=".epub" 
                  ref={fileInputRef}
                  onChange={handleFileChange} 
                />
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input 
                  value={newBookTitle} 
                  onChange={e => setNewBookTitle(e.target.value)} 
                  placeholder="Book Title" 
                />
              </div>
              <div className="space-y-2">
                <Label>Author</Label>
                <Input 
                  value={newBookAuthor} 
                  onChange={e => setNewBookAuthor(e.target.value)} 
                  placeholder="Author Name" 
                />
              </div>
              <Button onClick={handleUpload} disabled={isUploading} className="w-full">
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Upload
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : books.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-lg border border-dashed">
          <BookIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-muted-foreground">No books yet. Upload one to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {books.map(book => (
            <Card 
              key={book.id} 
              className="group cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/read/${book.id}`)}
            >
              <div className="aspect-[2/3] bg-slate-100 relative overflow-hidden rounded-t-lg">
                {book.coverImage ? (
                  <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <BookIcon className="w-12 h-12" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              </div>
              <CardContent className="p-3">
                <h3 className="font-medium truncate" title={book.title}>{book.title}</h3>
                <p className="text-xs text-muted-foreground truncate">{book.author}</p>
              </CardContent>
              <CardFooter className="p-3 pt-0 flex justify-between items-center text-xs text-muted-foreground">
                <span>{book.progress ? 'Reading' : 'New'}</span>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={(e) => handleDelete(e, book.id)}
                >
                    <Trash2 className="w-3 h-3" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
