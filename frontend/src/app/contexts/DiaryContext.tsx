import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:8080/api';

export interface Folder {
  id: string;
  userId: number;
  name: string;
  createdAt: string;
}

export interface DiaryEntry {
  id: string;
  userId?: number;
  title: string;
  content: string;
  date: Date;
  tags: string[];
  mood?: string;
  privacy: 'private' | 'shared';
  deleted?: boolean;
  updatedAt?: Date;
  authorName?: string;
  isLiked?: boolean;
  likeCount?: number;
  isVoted?: boolean;
  voteCount?: number;
  commentCount?: number;
  isStory?: boolean;
  folderId?: string;
}

interface User {
  id: number;
  email: string;
  name: string;
  commentCount?: number;
}

export interface Comment {
  id: number;
  userId: number;
  entryId: string;
  parentId?: number;
  content: string;
  createdAt: string;
  authorName?: string;
}

interface DiaryContextType {
  entries: DiaryEntry[];
  sharedEntries: DiaryEntry[];
  fetchSharedEntries: () => Promise<void>;
  likeEntry: (entryId: string) => Promise<void>;
  unlikeEntry: (entryId: string) => Promise<void>;
  voteEntry: (entryId: string) => Promise<void>;
  unvoteEntry: (entryId: string) => Promise<void>;
  addComment: (entryId: string, content: string, parentId?: number) => Promise<Comment | null>;
  deleteComment: (entryId: string, commentId: number) => Promise<boolean>;
  getComments: (entryId: string) => Promise<Comment[]>;
  addEntry: (entry: Omit<DiaryEntry, 'id' | 'date' | 'userId'>) => Promise<void>;
  updateEntry: (id: string, entry: Partial<DiaryEntry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  restoreEntry: (id: string) => Promise<void>;
  permanentlyDeleteEntry: (id: string) => Promise<void>;
  getEntry: (id: string) => DiaryEntry | undefined;
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  updateProfile: (name: string, email: string) => Promise<boolean>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  shortcuts: ShortcutMap;
  updateShortcut: (action: string, key: string) => void;
  resetShortcuts: () => void;
  folders: Folder[];
  createFolder: (name: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  moveEntryToFolder: (entryId: string, folderId: string | undefined) => Promise<void>;
}

export type ShortcutMap = {
  save: string;
  saveAndExit: string;
  bold: string;
  italic: string;
};

const DEFAULT_SHORTCUTS: ShortcutMap = {
  save: 's',
  saveAndExit: 'Enter',
  bold: 'b',
  italic: 'i',
};

const DiaryContext = createContext<DiaryContextType | undefined>(undefined);

export function DiaryProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [sharedEntries, setSharedEntries] = useState<DiaryEntry[]>([]);
  const [shortcuts, setShortcuts] = useState<ShortcutMap>(DEFAULT_SHORTCUTS);
  const [folders, setFolders] = useState<Folder[]>([]);

  // Load shortcuts from local storage
  useEffect(() => {
    const storedShortcuts = localStorage.getItem('diary_shortcuts');
    if (storedShortcuts) {
      setShortcuts({ ...DEFAULT_SHORTCUTS, ...JSON.parse(storedShortcuts) });
    }
  }, []);

  const fetchFolders = async (userId: number) => {
    try {
        const res = await fetch(`${API_BASE_URL}/folders?userId=${userId}`);
        const data = await res.json();
        if (data.code === 200) {
            setFolders(data.data);
        }
    } catch (e) {
        console.error("Failed to fetch folders", e);
    }
  };

  const createFolder = async (name: string) => {
    if (!user) return;
    try {
        const res = await fetch(`${API_BASE_URL}/folders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, name })
        });
        const data = await res.json();
        if (data.code === 200) {
            setFolders(prev => [...prev, data.data]);
        }
    } catch (e) {
        console.error("Failed to create folder", e);
    }
  };

  const deleteFolder = async (id: string) => {
    if (!user) return;
    try {
        const res = await fetch(`${API_BASE_URL}/folders/${id}?userId=${user.id}`, {
            method: 'DELETE'
        });
        const data = await res.json();
        if (data.code === 200) {
            setFolders(prev => prev.filter(f => f.id !== id));
            // Also update entries locally to remove folderId
            setEntries(prev => prev.map(e => e.folderId === id ? { ...e, folderId: undefined } : e));
        }
    } catch (e) {
        console.error("Failed to delete folder", e);
    }
  };

  const moveEntryToFolder = async (entryId: string, folderId: string | undefined) => {
    if (!user) return;
    try {
        const res = await fetch(`${API_BASE_URL}/entries/${entryId}/folder`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, folderId: folderId })
        });
        const data = await res.json();
        if (data.code === 200) {
            setEntries(prev => prev.map(e => e.id === entryId ? { ...e, folderId: folderId } : e));
        }
    } catch (e) {
        console.error("Failed to move entry", e);
    }
  };

  const updateShortcut = (action: string, key: string) => {
    const newShortcuts = { ...shortcuts, [action]: key };
    setShortcuts(newShortcuts);
    localStorage.setItem('diary_shortcuts', JSON.stringify(newShortcuts));
  };

  const resetShortcuts = () => {
    setShortcuts(DEFAULT_SHORTCUTS);
    localStorage.removeItem('diary_shortcuts');
  };

  // Load user from local storage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('diary_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const transformEntryFromApi = (apiEntry: any): DiaryEntry => {
    let date = new Date(apiEntry.date);
    
    // Fix: Handle invalid dates or 1970 epoch dates (often caused by null/0 values)
    if (isNaN(date.getTime()) || date.getFullYear() === 1970) {
      if (apiEntry.updatedAt) {
        date = new Date(apiEntry.updatedAt);
      } else if (apiEntry.createdAt || apiEntry.created_at) {
        date = new Date(apiEntry.createdAt || apiEntry.created_at);
      } else {
        date = new Date(); // Fallback to current date
      }
    }

    return {
      ...apiEntry,
      date,
      updatedAt: apiEntry.updatedAt ? new Date(apiEntry.updatedAt) : undefined,
      folderId: apiEntry.folderId || undefined,
    };
  };

  const fetchEntries = async (userId: number) => {
    try {
      // Fetch active entries
      const res = await fetch(`${API_BASE_URL}/entries?userId=${userId}`);
      const data = await res.json();
      if (data.code === 200) {
        const activeEntries = data.data.map(transformEntryFromApi);
        
        const trashRes = await fetch(`${API_BASE_URL}/entries/trash?userId=${userId}`);
        const trashData = await trashRes.json();
        let trashEntries: DiaryEntry[] = [];
        if (trashData.code === 200) {
            trashEntries = trashData.data.map(transformEntryFromApi);
        }

        setEntries([...activeEntries, ...trashEntries]);
      }
    } catch (error) {
      console.error('Failed to fetch entries:', error);
    }
  };

  // Fetch entries and folders when user changes
  useEffect(() => {
    if (user) {
      fetchEntries(user.id);
      fetchFolders(user.id);
    } else {
      setEntries([]);
      setFolders([]);
    }
  }, [user]);

  const fetchSharedEntries = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE_URL}/community/entries?userId=${user.id}`);
      const data = await res.json();
      if (data.code === 200) {
        setSharedEntries(data.data.map(transformEntryFromApi));
      }
    } catch (error) {
      console.error('Failed to fetch shared entries:', error);
    }
  };

  const likeEntry = async (entryId: string) => {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE_URL}/community/entries/${entryId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (data.code === 200) {
        setSharedEntries(prev => prev.map(entry => {
          if (entry.id === entryId) {
              return { 
                  ...entry, 
                  isLiked: true, 
                  likeCount: (entry.likeCount || 0) + 1 
              };
          }
          return entry;
        }));
      } else {
        alert(data.msg || "Failed to like entry");
      }
    } catch (error) {
      console.error('Like error:', error);
    }
  };

  const unlikeEntry = async (entryId: string) => {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE_URL}/community/entries/${entryId}/like?userId=${user.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.code === 200) {
        setSharedEntries(prev => prev.map(entry => {
          if (entry.id === entryId) {
              return { 
                  ...entry, 
                  isLiked: false, 
                  likeCount: Math.max(0, (entry.likeCount || 0) - 1) 
              };
          }
          return entry;
        }));
      }
    } catch (error) {
      console.error('Unlike error:', error);
    }
  };

  const voteEntry = async (entryId: string) => {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE_URL}/community/entries/${entryId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (data.code === 200) {
        setSharedEntries(prev => prev.map(entry => {
          if (entry.id === entryId) {
              return { 
                  ...entry, 
                  isVoted: true, 
                  voteCount: (entry.voteCount || 0) + 1 
              };
          }
          return entry;
        }));
      } else {
        alert(data.msg || "Failed to vote entry");
      }
    } catch (error) {
      console.error('Vote error:', error);
    }
  };

  const unvoteEntry = async (entryId: string) => {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE_URL}/community/entries/${entryId}/vote?userId=${user.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.code === 200) {
        setSharedEntries(prev => prev.map(entry => {
          if (entry.id === entryId) {
              return { 
                  ...entry, 
                  isVoted: false, 
                  voteCount: Math.max(0, (entry.voteCount || 0) - 1) 
              };
          }
          return entry;
        }));
      }
    } catch (error) {
      console.error('Unvote error:', error);
    }
  };

  const addComment = async (entryId: string, content: string, parentId?: number): Promise<Comment | null> => {
    if (!user) return null;
    try {
      const res = await fetch(`${API_BASE_URL}/community/entries/${entryId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, content, parentId }),
      });
      const data = await res.json();
      if (data.code === 200) {
         setSharedEntries(prev => prev.map(entry => {
            if (entry.id === entryId) {
                return { 
                    ...entry, 
                    commentCount: (entry.commentCount || 0) + 1 
                };
            }
            return entry;
          }));
         return { ...data.data, authorName: user.name };
      }
      return null;
    } catch (error) {
      console.error('Add comment error:', error);
      return null;
    }
  };

  const deleteComment = async (entryId: string, commentId: number): Promise<boolean> => {
    if (!user) return false;
    try {
      const res = await fetch(`${API_BASE_URL}/community/entries/${entryId}/comments/${commentId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.code === 200) {
        setSharedEntries(prev => prev.map(entry => {
          if (entry.id === entryId) {
            return { 
              ...entry, 
              commentCount: Math.max(0, (entry.commentCount || 0) - 1) 
            };
          }
          return entry;
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Delete comment error:', error);
      return false;
    }
  };

  const getComments = async (entryId: string): Promise<Comment[]> => {
    try {
      const res = await fetch(`${API_BASE_URL}/community/entries/${entryId}/comments`);
      const data = await res.json();
      if (data.code === 200) {
        return data.data;
      }
      return [];
    } catch (error) {
      console.error('Get comments error:', error);
      return [];
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.code === 200) {
        setUser(data.data);
        localStorage.setItem('diary_user', JSON.stringify(data.data));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('diary_user');
    setEntries([]);
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (data.code === 200) {
        setUser(data.data);
        localStorage.setItem('diary_user', JSON.stringify(data.data));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Register error:', error);
      return false;
    }
  };

  const addEntry = async (entry: Omit<DiaryEntry, 'id' | 'date' | 'userId'>) => {
    if (!user) return;
    
    const newEntryPayload = {
      ...entry,
      userId: user.id,
      date: new Date().toISOString().split('T')[0], // yyyy-MM-dd
      tags: entry.tags || [], // Ensure tags is array
    };

    try {
      const res = await fetch(`${API_BASE_URL}/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEntryPayload),
      });
      const data = await res.json();
      if (data.code === 200) {
        if (data.data) {
             setEntries([transformEntryFromApi(data.data), ...entries]);
        } else {
             fetchEntries(user.id);
        }
      } else {
        throw new Error(data.msg || 'Failed to create entry');
      }
    } catch (error) {
      console.error('Add entry error:', error);
      throw error;
    }
  };

  const updateEntry = async (id: string, updatedData: Partial<DiaryEntry>) => {
    if (!user) return;
    
    const entry = entries.find(e => e.id === id);
    if (!entry) return;

    const payload: any = { ...updatedData };
    if (payload.date instanceof Date) {
        payload.date = payload.date.toISOString().split('T')[0];
    }

    try {
      const res = await fetch(`${API_BASE_URL}/entries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.code === 200) {
        setEntries(entries.map(e => 
          e.id === id ? { ...e, ...updatedData, updatedAt: new Date() } : e
        ));
      } else {
        throw new Error(data.msg || 'Failed to update entry');
      }
    } catch (error) {
      console.error('Update entry error:', error);
      throw error;
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/entries/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.code === 200) {
        setEntries(entries.map(entry => 
          entry.id === id ? { ...entry, deleted: true } : entry
        ));
      }
    } catch (error) {
       console.error('Delete entry error:', error);
    }
  };

  const restoreEntry = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/entries/${id}/restore`, {
        method: 'PUT',
      });
      const data = await res.json();
      if (data.code === 200) {
        setEntries(entries.map(entry => 
          entry.id === id ? { ...entry, deleted: false } : entry
        ));
      }
    } catch (error) {
       console.error('Restore entry error:', error);
    }
  };

  const permanentlyDeleteEntry = async (id: string) => {
    try {
        const res = await fetch(`${API_BASE_URL}/entries/${id}/permanent`, {
          method: 'DELETE',
        });
        const data = await res.json();
        if (data.code === 200) {
          setEntries(entries.filter(entry => entry.id !== id));
        }
      } catch (error) {
         console.error('Permanent delete entry error:', error);
      }
  };

  const updateProfile = async (name: string, email: string) => {
    if (!user) return false;
    try {
      const res = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, name, email }),
      });
      const data = await res.json();
      if (data.code === 200) {
        const updatedUser = { ...user, name, email };
        setUser(updatedUser);
        localStorage.setItem('diary_user', JSON.stringify(updatedUser));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Update profile error:', error);
      return false;
    }
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    if (!user) return false;
    try {
      const res = await fetch(`${API_BASE_URL}/auth/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, currentPassword, newPassword }),
      });
      const data = await res.json();
      if (data.code === 200) {
        return true;
      }
      return false;
    } catch (error) {
      console.error('Update password error:', error);
      return false;
    }
  };

  const getEntry = (id: string) => {
    return entries.find(entry => entry.id === id);
  };

  return (
    <DiaryContext.Provider
      value={{
        entries,
        sharedEntries,
        fetchSharedEntries,
        likeEntry,
        unlikeEntry,
        voteEntry,
        unvoteEntry,
        addComment,
        deleteComment,
        getComments,
        addEntry,
        updateEntry,
        deleteEntry,
        restoreEntry,
        permanentlyDeleteEntry,
        getEntry,
        user,
        login,
        logout,
        register,
        updateProfile,
        updatePassword,
        shortcuts,
        updateShortcut,
        resetShortcuts,
        folders,
        createFolder,
        deleteFolder,
        moveEntryToFolder,
      }}
    >
      {children}
    </DiaryContext.Provider>
  );
}

export function useDiary() {
  const context = useContext(DiaryContext);
  if (context === undefined) {
    throw new Error('useDiary must be used within a DiaryProvider');
  }
  return context;
}
