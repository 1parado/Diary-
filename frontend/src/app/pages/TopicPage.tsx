import { useState, useEffect } from 'react';
import { useDiary, DiaryEntry } from '../contexts/DiaryContext';
import { getDailyTopic, getTopicTag } from '../utils/topics';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Trophy, Heart, PenLine, AlertCircle, LayoutList, LayoutGrid } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';

export function TopicPage() {
  const { user, entries, sharedEntries, fetchSharedEntries, addEntry, likeEntry, unlikeEntry, voteEntry, unvoteEntry } = useDiary();
  const [topic, setTopic] = useState('');
  const [storyContent, setStoryContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mySubmission, setMySubmission] = useState<DiaryEntry | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const today = new Date();
  const dailyTopic = getDailyTopic(today);
  const topicTag = getTopicTag(today);

  useEffect(() => {
    setTopic(dailyTopic);
    // Fetch shared entries to get the latest votes and stories
    fetchSharedEntries();
  }, [user]);

  useEffect(() => {
    // Check if user has already submitted a story for today
    if (entries) {
      // Check for isStory flag or topic tag
      const submission = entries.find(e => 
        (e.isStory && isSameDay(new Date(e.date), today)) || 
        e.tags?.includes(topicTag)
      );
      setMySubmission(submission || null);
    }
  }, [entries, topicTag]);

  const handleSubmitStory = async () => {
    if (!storyContent.trim()) {
      toast.error("Story cannot be empty");
      return;
    }

    setIsSubmitting(true);
    try {
      await addEntry({
        title: `Story: ${dailyTopic}`,
        content: storyContent,
        privacy: 'shared',
        tags: [topicTag, 'Story'],
        mood: 'creative',
        isStory: true
      });
      setStoryContent('');
      toast.success("Story submitted successfully!");
      // Refresh shared entries
      fetchSharedEntries();
    } catch (error) {
      toast.error("Failed to submit story");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = async (entry: DiaryEntry) => {
    if (!user) return;

    // Check if user has already voted for another story today
    // Note: The backend also enforces this, but frontend check provides immediate feedback
    const votedEntry = sharedEntries.find(e => 
      e.isStory && isSameDay(new Date(e.date), today) && e.isVoted && e.id !== entry.id
    );

    if (votedEntry) {
      toast.error("One person, one vote! You have already voted for another story today.");
      return;
    }

    // Use voteEntry/unvoteEntry for stories instead of likeEntry
    if (entry.isVoted) {
        await unvoteEntry(entry.id);
    } else {
        await voteEntry(entry.id);
    }
  };

  // Filter stories for today's topic or marked as today's story
  const topicStories = sharedEntries.filter(e => {
    const isToday = isSameDay(new Date(e.date), today);
    return isToday && (e.isStory || e.tags?.includes(topicTag));
  });
  
  // Sort by votes for Honor Board
  const sortedStories = [...topicStories].sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0));
  const topThree = sortedStories.slice(0, 3).filter(e => (e.voteCount || 0) > 0);

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <Badge variant="outline" className="px-4 py-1 text-sm bg-indigo-50 text-indigo-700 border-indigo-200">
          Daily Topic • {format(today, 'MMMM do, yyyy')}
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">{topic}</h1>
        <p className="text-slate-500 max-w-2xl mx-auto">
          Write a short story based on today's topic. Vote for your favorites. 
          The top 3 stories will be featured on the Honor Board.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Content Area - Left 2/3 */}
        <div className="md:col-span-2 space-y-8">
          
         

          {/* All Stories Feed */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-slate-800">Community Stories</h2>
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
            </div>

            {topicStories.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                <p className="text-slate-500">No stories yet. Be the first to write one!</p>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-4"}>
                {topicStories.map(story => (
                  <Card key={story.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-indigo-100 text-indigo-600">
                              {story.authorName?.[0]?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium text-slate-900">{story.authorName || 'Anonymous'}</p>
                            <p className="text-xs text-slate-500">{format(new Date(story.date), 'MMM d, h:mm a')}</p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className={`text-slate-700 leading-relaxed ${viewMode === 'grid' ? 'line-clamp-4' : 'whitespace-pre-wrap'}`}>
                        {story.content}
                      </p>
                    </CardContent>
                    <CardFooter className="pt-0 flex justify-end">
                      <Button 
                        variant={story.isVoted ? "secondary" : "ghost"} 
                        size="sm" 
                        className={`gap-1 ${story.isVoted ? 'text-red-600 bg-red-50 hover:bg-red-100' : 'text-slate-500'}`}
                        onClick={() => handleVote(story)}
                      >
                        <Heart className={`w-4 h-4 ${story.isVoted ? 'fill-current' : ''}`} />
                        <span>{story.voteCount || 0}</span>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Right 1/3 - Honor Board */}
        <div className="space-y-6">
          <Card className="bg-gradient-to-b from-amber-50 to-white border-amber-100 shadow-sm sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-700">
                <Trophy className="w-5 h-5" />
                Honor Board
              </CardTitle>
              <CardDescription>Top 3 stories of the day</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {topThree.length === 0 ? (
                <p className="text-sm text-slate-500 italic text-center py-4">Waiting for votes...</p>
              ) : (
                topThree.map((story, index) => (
                  <div key={story.id} className="flex items-start gap-3 p-3 rounded-lg bg-white/50 border border-amber-100/50">
                    <div className={`
                      w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5
                      ${index === 0 ? 'bg-amber-400 text-white shadow-sm' : ''}
                      ${index === 1 ? 'bg-slate-300 text-white' : ''}
                      ${index === 2 ? 'bg-amber-700/20 text-amber-800' : ''}
                    `}>
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 truncate">{story.authorName || 'Anonymous'}</p>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">{story.content}</p>
                      <div className="flex items-center gap-1 mt-2 text-xs text-amber-600 font-medium">
                        <Heart className="w-3 h-3 fill-current" />
                        {story.likeCount || 0} votes
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-50 border-slate-200">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Rules
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 space-y-2">
              <p>• Write a story based on the daily topic.</p>
              <p>• You can only submit one story per day.</p>
              <p>• One person, one vote. Choose wisely!</p>
              <p>• Be kind and respectful.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
