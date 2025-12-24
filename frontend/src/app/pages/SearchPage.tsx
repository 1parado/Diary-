import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDiary } from '../contexts/DiaryContext';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Search, Calendar, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../components/ui/utils';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Calendar as CalendarComponent } from '../components/ui/calendar';
import { DateRange } from "react-day-picker";

export function SearchPage() {
  const { entries } = useDiary();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const activeEntries = entries.filter(entry => !entry.deleted);
  
  // Get all unique tags
  const allTags = Array.from(new Set(activeEntries.flatMap(entry => entry.tags)));

  // Filter entries
  const filteredEntries = activeEntries.filter(entry => {
    const matchesSearch = searchQuery === '' || 
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTags = selectedTags.length === 0 ||
      selectedTags.every(tag => entry.tags.includes(tag));
    
    // Normalize dates to start of day for accurate comparison
    const entryDate = new Date(entry.date);
    entryDate.setHours(0, 0, 0, 0);

    let matchesDateRange = true;
    if (dateRange?.from) {
        const fromDate = new Date(dateRange.from);
        fromDate.setHours(0, 0, 0, 0);
        if (entryDate < fromDate) matchesDateRange = false;
    }
    if (dateRange?.to) {
        const toDate = new Date(dateRange.to);
        toDate.setHours(0, 0, 0, 0);
        if (entryDate > toDate) matchesDateRange = false;
    }

    return matchesSearch && matchesTags && matchesDateRange;
  });

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTags([]);
    setDateRange(undefined);
  };

  const hasActiveFilters = searchQuery || selectedTags.length > 0 || dateRange?.from || dateRange?.to;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl text-slate-800 mb-6">Search & Filter</h1>

          {/* Search Input */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search entries by title or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-6">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-[260px] justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-50 bg-white dark:bg-slate-950" align="start">
                <CalendarComponent
                  mode="range"
                  defaultMonth={dateRange?.from || new Date()}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={1}
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="w-4 h-4" />
                  Tags
                  {selectedTags.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {selectedTags.length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64">
                <div className="space-y-2">
                  <p className="text-sm text-slate-600 mb-3">Select tags to filter</p>
                  <div className="flex flex-wrap gap-2">
                    {allTags.map(tag => (
                      <Badge
                        key={tag}
                        variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                        className={`cursor-pointer ${selectedTags.includes(tag) ? 'bg-indigo-600' : ''}`}
                        onClick={() => toggleTag(tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="gap-2 text-slate-600"
              >
                <X className="w-4 h-4" />
                Clear filters
              </Button>
            )}
          </div>

          {/* Active Filters Display */}
          {(selectedTags.length > 0 || dateRange?.from) && (
            <div className="flex flex-wrap gap-2 mb-6">
              {selectedTags.map(tag => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="bg-indigo-100 text-indigo-700 gap-1"
                >
                  {tag}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => toggleTag(tag)}
                  />
                </Badge>
              ))}
              {dateRange?.from && (
                <Badge variant="secondary" className="bg-slate-100 text-slate-700 gap-1">
                  {format(dateRange.from, 'MMM d')}
                  {dateRange.to && ` - ${format(dateRange.to, 'MMM d')}`}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => setDateRange(undefined)}
                  />
                </Badge>
              )}
            </div>
          )}

          {/* Results */}
          <div className="mb-4">
            <p className="text-slate-600">
              {filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'} found
            </p>
          </div>
        </div>

        {/* Results List */}
        {filteredEntries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500 mb-4">No entries found matching your criteria</p>
            <Button variant="outline" onClick={clearFilters}>
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEntries.map(entry => (
              <div
                key={entry.id}
                onClick={() => navigate(`/entry/${entry.id}`)}
                className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-lg hover:border-indigo-200 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg text-slate-800 hover:text-indigo-600 transition-colors">
                    {entry.title}
                  </h3>
                  <p className="text-sm text-slate-500 whitespace-nowrap ml-4">
                    {format(entry.date, 'MMM d, yyyy')}
                  </p>
                </div>
                <p className="text-slate-600 mb-4 line-clamp-2">
                  {entry.content}
                </p>
                <div className="flex flex-wrap gap-2">
                  {entry.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="bg-slate-100 text-slate-600">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
