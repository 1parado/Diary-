import { useDiary } from '../contexts/DiaryContext';
import { Card } from '../components/ui/card';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { BookOpen, TrendingUp, Calendar, Smile } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, differenceInDays, subDays, startOfYear, endOfYear, getDay } from 'date-fns';

export function AnalyticsPage() {
  const { entries } = useDiary();
  const activeEntries = entries.filter(entry => !entry.deleted);

  // Daily activity for calendar heatmap
  const dailyActivity = activeEntries.reduce((acc, entry) => {
    const dateStr = format(entry.date, 'yyyy-MM-dd');
    acc[dateStr] = (acc[dateStr] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Generate dates for the current year
  const today = new Date();
  const startDate = startOfYear(today);
  const endDate = endOfYear(today);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  // Calculate writing streak
  const sortedDates = activeEntries
    .map(e => format(e.date, 'yyyy-MM-dd'))
    .sort()
    .reverse();
  
  let currentStreak = 0;
  const todayStr = format(today, 'yyyy-MM-dd');
  
  for (let i = 0; i < sortedDates.length; i++) {
    const daysDiff = differenceInDays(new Date(todayStr), new Date(sortedDates[i]));
    if (daysDiff === i || daysDiff === i + 1) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Monthly count
  const monthlyData = activeEntries.reduce((acc, entry) => {
    const month = format(entry.date, 'MMM yyyy');
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const monthlyChartData = Object.entries(monthlyData).map(([month, count]) => ({
    month,
    count,
  }));

  // Prepare calendar grid data (weeks)
  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];
  
  // Pad the beginning of the first week (Monday start)
  const dayOfWeek = getDay(startDate);
  const paddingDays = (dayOfWeek + 6) % 7;
  for (let i = 0; i < paddingDays; i++) {
    currentWeek.push(null as any);
  }

  calendarDays.forEach(day => {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  // Pad the end of the last week if necessary
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null as any);
    }
    weeks.push(currentWeek);
  }
  
  // Mood distribution
  const moodData = activeEntries.reduce((acc, entry) => {
    if (entry.mood) {
      acc[entry.mood] = (acc[entry.mood] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const moodChartData = Object.entries(moodData).map(([mood, count]) => ({
    name: mood.charAt(0).toUpperCase() + mood.slice(1),
    value: count,
  }));

  const COLORS = ['#818cf8', '#f472b6', '#34d399', '#fbbf24', '#fb923c', '#a78bfa', '#60a5fa', '#f87171'];

  // Tag frequency
  const tagData = activeEntries.reduce((acc, entry) => {
    entry.tags.forEach(tag => {
      acc[tag] = (acc[tag] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const topTags = Object.entries(tagData)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([tag, count]) => ({
      tag,
      count,
    }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl text-slate-800 mb-2">Your Writing Journey</h1>
          <p className="text-slate-500">Insights and statistics from your diary</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-white border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Total Entries</p>
                <p className="text-3xl text-slate-800">{activeEntries.length}</p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Writing Streak</p>
                <p className="text-3xl text-slate-800">{currentStreak} days</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">This Month</p>
                <p className="text-3xl text-slate-800">
                  {activeEntries.filter(e => 
                    e.date >= startOfMonth(new Date()) && 
                    e.date <= endOfMonth(new Date())
                  ).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Moods Tracked</p>
                <p className="text-3xl text-slate-800">{Object.keys(moodData).length}</p>
              </div>
              <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
                <Smile className="w-6 h-6 text-pink-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Activity Calendar */}
          <Card className="p-6 bg-white border-slate-200 col-span-1 lg:col-span-2 overflow-hidden">
            <h2 className="text-lg text-slate-800 mb-6">Activity Calendar ({format(today, 'yyyy')})</h2>
            <div className="w-full overflow-x-auto pb-4">
              <div className="min-w-max">
                {/* Month Labels */}
                <div className="flex gap-1.5 mb-2 ml-10">
                  {weeks.map((week, i) => {
                    const firstDayOfMonth = week.find(d => d && d.getDate() === 1);
                    return (
                      <div key={i} className="w-8 text-xs text-slate-400 font-medium text-center">
                        {firstDayOfMonth ? format(firstDayOfMonth, 'MMM') : ''}
                      </div>
                    );
                  })}
                </div>
                
                <div className="flex gap-2">
                  {/* Day Labels */}
                  <div className="flex flex-col gap-1.5 pr-2 sticky left-0 bg-white z-10">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                      <div key={day} className="h-8 flex items-center text-xs text-slate-400 font-medium justify-end min-w-[2rem]">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Grid */}
                  <div className="flex gap-1.5">
                    {weeks.map((week, weekIndex) => (
                      <div key={weekIndex} className="flex flex-col gap-1.5">
                        {week.map((day, dayIndex) => {
                          if (!day) return <div key={dayIndex} className="w-8 h-8" />;
                          
                          const dateStr = format(day, 'yyyy-MM-dd');
                          const count = dailyActivity[dateStr] || 0;
                          
                          let bgClass = 'bg-slate-50 border-slate-100';
                          let textClass = 'text-transparent';
                          
                          if (count > 0) {
                            textClass = 'text-indigo-900 font-semibold';
                            if (count === 1) bgClass = 'bg-indigo-200 border-indigo-300';
                            else if (count <= 3) bgClass = 'bg-indigo-300 border-indigo-400';
                            else bgClass = 'bg-indigo-400 border-indigo-500';
                          }

                          return (
                            <div
                              key={dateStr}
                              className={`w-8 h-8 rounded border flex items-center justify-center text-xs transition-all hover:scale-110 cursor-help ${bgClass}`}
                              title={`${dateStr}: ${count} entries`}
                            >
                              <span className={textClass}>{count > 0 ? count : ''}</span>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Mood Distribution */}
          <Card className="p-6 bg-white border-slate-200">
            <h2 className="text-lg text-slate-800 mb-6">Mood Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={moodChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {moodChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Top Tags */}
        <Card className="p-6 bg-white border-slate-200">
          <h2 className="text-lg text-slate-800 mb-6">Top Tags</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topTags} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" stroke="#64748b" />
              <YAxis dataKey="tag" type="category" stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="count" fill="#34d399" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Positive Message */}
        <Card className="p-8 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200 mt-6">
          <div className="text-center">
            <h3 className="text-xl text-slate-800 mb-2">Keep up the great work! 🌟</h3>
            <p className="text-slate-600">
              You've been consistently documenting your journey. Every entry is a step towards self-discovery.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
