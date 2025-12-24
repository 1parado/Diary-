import { useEffect, useState, useMemo } from 'react';
import { useDiary, DiaryEntry, Comment } from '../contexts/DiaryContext';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Heart, ThumbsUp, LayoutList, MessageSquare, Send, Trash2, CornerDownRight, X, Search, Filter, Calendar, Tag } from 'lucide-react';
import { format, isAfter, subDays, subWeeks } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

export function CommunityPage() {
  const { user, sharedEntries, fetchSharedEntries, likeEntry, unlikeEntry, voteEntry, unvoteEntry, addComment, deleteComment, getComments } = useDiary();
  const [expandedComments, setExpandedComments] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  
  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'all' | 'user' | 'tag'>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | '1day' | '1week'>('all');

  useEffect(() => {
    if (user) {
      fetchSharedEntries();
    }
  }, [user]);

  const filteredEntries = useMemo(() => {
    return sharedEntries.filter(entry => {
      // 1. Time Filter
      let matchesTime = true;
      const entryDate = new Date(entry.date);
      if (timeFilter === '1day') {
        matchesTime = isAfter(entryDate, subDays(new Date(), 1));
      } else if (timeFilter === '1week') {
        matchesTime = isAfter(entryDate, subWeeks(new Date(), 1));
      }

      // 2. Search Filter
      let matchesSearch = true;
      const query = searchQuery.toLowerCase().trim();
      
      if (query) {
        if (searchType === 'user') {
          matchesSearch = (entry.authorName?.toLowerCase() || '').includes(query);
        } else if (searchType === 'tag') {
          matchesSearch = entry.tags.some(tag => tag.toLowerCase().includes(query));
        } else {
          // 'all' searches both user, tags, and maybe title/content
          matchesSearch = 
            (entry.authorName?.toLowerCase() || '').includes(query) ||
            entry.tags.some(tag => tag.toLowerCase().includes(query)) ||
            entry.title.toLowerCase().includes(query) ||
            entry.content.toLowerCase().includes(query);
        }
      }

      return matchesTime && matchesSearch;
    });
  }, [sharedEntries, searchQuery, searchType, timeFilter]);

  const handleLikeToggle = async (entry: DiaryEntry) => {
    if (entry.isLiked) {
      await unlikeEntry(entry.id);
    } else {
      await likeEntry(entry.id);
    }
  };

  const handleVoteToggle = async (entry: DiaryEntry) => {
    if (entry.isVoted) {
      await unvoteEntry(entry.id);
    } else {
      await voteEntry(entry.id);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className={`${viewMode === 'grid' ? 'max-w-7xl' : 'max-w-3xl'} mx-auto px-4 py-8 transition-all duration-300`}>
        <div className="mb-8">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h1 className="text-3xl text-slate-800 mb-2">Community</h1>
              <p className="text-slate-500">Discover shared stories from other diary keepers</p>
            </div>
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
                <LayoutList className="w-4 h-4 rotate-90" />
              </Button>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4 md:space-y-0 md:flex md:items-center md:gap-4">
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  placeholder="Search stories..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={searchType} onValueChange={(v: any) => setSearchType(v)}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Search by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="tag">Tag</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2 border-l border-slate-100 pl-4">
              <Filter className="w-4 h-4 text-slate-400" />
              <Select value={timeFilter} onValueChange={(v: any) => setTimeFilter(v)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Time Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="1day">Last 24 Hours</SelectItem>
                  <SelectItem value="1week">Last Week</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-6'}>
          {filteredEntries.map(entry => (
            <CommunityEntryCard
              key={entry.id}
              entry={entry}
              onLike={() => handleLikeToggle(entry)}
              onVote={() => handleVoteToggle(entry)}
              isCommentsExpanded={expandedComments === entry.id}
              onToggleComments={() => setExpandedComments(expandedComments === entry.id ? null : entry.id)}
              onAddComment={addComment}
              onDeleteComment={deleteComment}
              onGetComments={getComments}
              currentUserId={user?.id}
            />
          ))}
          {filteredEntries.length === 0 && (
            <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <div className="flex justify-center mb-4">
                <Search className="w-12 h-12 text-slate-300" />
              </div>
              <p className="text-lg font-medium text-slate-600">No entries found</p>
              <p className="text-sm text-slate-400 mt-1">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const buildCommentTree = (comments: Comment[]) => {
  const commentMap: { [key: number]: any } = {};
  const roots: any[] = [];
  
  // Deep copy to avoid mutating state directly
  const commentsCopy = comments.map(c => ({...c, children: []}));

  commentsCopy.forEach(c => {
    commentMap[c.id] = c;
  });

  commentsCopy.forEach(c => {
    if (c.parentId && commentMap[c.parentId]) {
      commentMap[c.parentId].children.push(c);
    } else {
      roots.push(c);
    }
  });

  return roots;
};

interface CommentItemProps {
  comment: any;
  depth?: number;
  currentUserId?: number;
  onReply: (comment: Comment) => void;
  onDelete: (id: number) => void;
}

const CommentItem = ({ comment, depth = 0, currentUserId, onReply, onDelete }: CommentItemProps) => (
  <div className={`flex flex-col gap-2 ${depth > 0 ? 'ml-8 mt-2 relative' : ''}`}>
    {depth > 0 && (
        <div className="absolute -left-4 top-0 bottom-6 w-4 border-l-2 border-b-2 border-slate-100 rounded-bl-lg" />
    )}
    <div className="flex gap-3 relative z-10">
      <Avatar className="w-8 h-8">
        <AvatarFallback className="text-xs">{comment.authorName?.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 bg-white p-3 rounded-lg border border-slate-200">
        <div className="flex justify-between items-start mb-1">
          <span className="text-sm font-medium text-slate-900">{comment.authorName}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">{format(new Date(comment.createdAt), 'MMM d, HH:mm')}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 text-slate-400 hover:text-indigo-500"
              onClick={() => onReply(comment)}
            >
              <CornerDownRight className="w-3 h-3" />
            </Button>
            {currentUserId === comment.userId && (
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 text-slate-400 hover:text-red-500"
                onClick={() => onDelete(comment.id)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
        <p className="text-sm text-slate-600">{comment.content}</p>
      </div>
    </div>
    {comment.children.length > 0 && (
        <div className="space-y-2">
            {comment.children.map((child: any) => (
                <CommentItem 
                  key={child.id} 
                  comment={child} 
                  depth={depth + 1} 
                  currentUserId={currentUserId}
                  onReply={onReply}
                  onDelete={onDelete}
                />
            ))}
        </div>
    )}
  </div>
);

interface CommunityEntryCardProps {
  entry: DiaryEntry;
  onLike: () => void;
  onVote: () => void;
  isCommentsExpanded: boolean;
  onToggleComments: () => void;
  onAddComment: (id: string, content: string, parentId?: number) => Promise<Comment | null>;
  onDeleteComment: (entryId: string, commentId: number) => Promise<boolean>;
  onGetComments: (id: string) => Promise<Comment[]>;
  currentUserId?: number;
}

function CommunityEntryCard({ entry, onLike, onVote, isCommentsExpanded, onToggleComments, onAddComment, onDeleteComment, onGetComments, currentUserId }: CommunityEntryCardProps) {
  const [commentInput, setCommentInput] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);

  useEffect(() => {
    if (isCommentsExpanded) {
      setIsLoadingComments(true);
      onGetComments(entry.id).then(data => {
        setComments(data);
        setIsLoadingComments(false);
      });
    }
  }, [isCommentsExpanded, entry.id]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;

    const newComment = await onAddComment(entry.id, commentInput, replyingTo?.id);
    if (newComment) {
      setComments([...comments, newComment]);
      setCommentInput('');
      setReplyingTo(null);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    const success = await onDeleteComment(entry.id, commentId);
    if (success) {
      // Find all descendant IDs to remove them from UI
      const getDescendantIds = (parentId: number, allComments: Comment[]): number[] => {
        const children = allComments.filter(c => c.parentId === parentId);
        let ids = children.map(c => c.id);
        children.forEach(child => {
            ids = [...ids, ...getDescendantIds(child.id, allComments)];
        });
        return ids;
      };
      
      const idsToRemove = [commentId, ...getDescendantIds(commentId, comments)];
      setComments(comments.filter(c => !idsToRemove.includes(c.id)));
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <Avatar>
          <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${entry.authorName}`} />
          <AvatarFallback>{entry.authorName?.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-medium text-slate-900">{entry.authorName}</h3>
          <p className="text-xs text-slate-500">{format(entry.date, 'MMM d, yyyy')}</p>
        </div>
      </div>

      <h2 className="text-xl text-slate-800 mb-2">{entry.title}</h2>
      <div className="text-slate-600 mb-4 prose prose-slate prose-sm max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{entry.content}</ReactMarkdown>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {entry.tags.map(tag => (
          <Badge key={tag} variant="secondary" className="bg-slate-100">
            {tag}
          </Badge>
        ))}
      </div>

      <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
        {entry.isStory ? (
          <Button
            variant="ghost"
            size="sm"
            className={`gap-2 ${entry.isVoted ? 'text-pink-600' : 'text-slate-500'}`}
            onClick={onVote}
          >
            <Heart className={`w-4 h-4 ${entry.isVoted ? 'fill-current' : ''}`} />
            {entry.voteCount || 0}
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className={`gap-2 ${entry.isLiked ? 'text-indigo-600' : 'text-slate-500'}`}
            onClick={onLike}
          >
            <ThumbsUp className={`w-4 h-4 ${entry.isLiked ? 'fill-current' : ''}`} />
            {entry.likeCount || 0}
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-slate-500"
          onClick={onToggleComments}
        >
          <MessageSquare className="w-4 h-4" />
          {entry.commentCount || 0}
        </Button>
      </div>

      {isCommentsExpanded && (
        <div className="mt-4 pt-4 border-t border-slate-100 bg-slate-50/50 -mx-6 -mb-6 p-6">
          <div className="space-y-4 mb-4">
            {isLoadingComments ? (
               <p className="text-sm text-slate-500 text-center">Loading comments...</p>
            ) : comments.length > 0 ? (
              buildCommentTree(comments).map(comment => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  currentUserId={currentUserId}
                  onReply={setReplyingTo}
                  onDelete={handleDeleteComment}
                />
              ))
            ) : (
              <p className="text-sm text-slate-500 text-center">No comments yet.</p>
            )}
          </div>

          <form onSubmit={handleSubmitComment} className="flex flex-col gap-2">
            {replyingTo && (
                <div className="flex items-center justify-between bg-indigo-50 px-3 py-2 rounded-lg text-sm text-indigo-600 border border-indigo-100">
                    <span className="flex items-center gap-2">
                        <CornerDownRight className="w-3 h-3" />
                        Replying to <span className="font-medium">{replyingTo.authorName}</span>
                    </span>
                    <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-5 w-5 hover:bg-indigo-100 rounded-full" 
                        onClick={() => setReplyingTo(null)}
                        type="button"
                    >
                        <X className="w-3 h-3" />
                    </Button>
                </div>
            )}
            <div className="flex gap-2">
                <Input
                  placeholder={replyingTo ? `Reply to ${replyingTo.authorName}...` : "Write a comment..."}
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  className="bg-white"
                />
                <Button type="submit" size="icon" disabled={!commentInput.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
            </div>
          </form>
        </div>
      )}
    </Card>
  );
}
