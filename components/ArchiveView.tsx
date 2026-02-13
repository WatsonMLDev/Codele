import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Star, Lock, CheckCircle2, XCircle } from 'lucide-react';
import { ProblemService } from '../services/ProblemService';
import { StorageService } from '../services/StorageService';
import { CalendarDay, WeeklyTheme, Difficulty } from '../types';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Theme colors for visualization
const THEME_COLORS = [
  { bg: 'bg-blue-500/20', border: 'border-blue-500', text: 'text-blue-400' },
  { bg: 'bg-purple-500/20', border: 'border-purple-500', text: 'text-purple-400' },
  { bg: 'bg-pink-500/20', border: 'border-pink-500', text: 'text-pink-400' },
  { bg: 'bg-emerald-500/20', border: 'border-emerald-500', text: 'text-emerald-400' },
  { bg: 'bg-orange-500/20', border: 'border-orange-500', text: 'text-orange-400' },
];

const getDifficultyColor = (diff: Difficulty) => {
  switch (diff) {
    case 'Easy': return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'Medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'Hard': return 'bg-red-500/20 text-red-400 border-red-500/30';
    default: return 'bg-gray-800 text-gray-400 border-gray-700';
  }
};

const ArchiveView: React.FC = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([]);
  const [themes, setThemes] = useState<WeeklyTheme[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Year and Month for API queries
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed
  const monthStr = `${year}-${(month + 1).toString().padStart(2, '0')}`;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [cal, th] = await Promise.all([
          ProblemService.getCalendar(monthStr),
          ProblemService.getThemes(monthStr)
        ]);
        setCalendarData(cal || []); // Ensure array
        setThemes(th || []); // Ensure array
      } catch (err) {
        console.error("Failed to load archive data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [monthStr]);

  // Calendar Grid Logic
  const gridDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // 0 = Sun, 1 = Mon ... 6 = Sat. We want Mon=0.
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const days = [];
    
    // Padding (empty cells before 1st)
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    
    // Actual Days
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${monthStr}-${i.toString().padStart(2, '0')}`;
      days.push({ day: i, dateStr });
    }
    
    return days;
  }, [year, month, monthStr]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    const now = new Date();
    // Prevent going into future months
    if (year === now.getFullYear() && month === now.getMonth()) return;
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const isFuture = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    now.setHours(0,0,0,0);
    return d > now;
  };

  // Get status from local storage
  const getDayStatus = (dateStr: string) => {
    const state = StorageService.loadGameState(dateStr);
    if (!state) return 'unattempted';
    return state.gameState; // 'WON' | 'LOST' | 'PLAYING'
  };

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white overflow-hidden animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex-none h-16 px-6 border-b border-gray-800 flex items-center justify-between bg-gray-900/50 backdrop-blur">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-white">
             <ChevronLeft className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-bold tracking-tight">Archive</h2>
        </div>

        <div className="flex items-center gap-6">
             <div className="flex items-center gap-2 bg-gray-900 p-1 rounded-lg border border-gray-800">
                <button onClick={handlePrevMonth} className="p-1.5 hover:bg-gray-800 rounded text-gray-400 hover:text-white">
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="w-32 text-center font-mono font-bold text-sm">
                    {MONTHS[month]} {year}
                </span>
                <button 
                    onClick={handleNextMonth} 
                    className={`p-1.5 rounded transition-colors ${
                        year === new Date().getFullYear() && month === new Date().getMonth() 
                        ? 'text-gray-700 cursor-not-allowed' 
                        : 'hover:bg-gray-800 text-gray-400 hover:text-white'
                    }`}
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
             </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <div className="max-w-6xl mx-auto pb-10">
            
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-2 md:gap-4 mb-4">
                {DAYS.map(d => (
                    <div key={d} className="text-center text-xs font-bold text-gray-500 uppercase tracking-widest">{d}</div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2 md:gap-4">
                {gridDays.map((cell, idx) => {
                    if (!cell) {
                        return <div key={`pad-${idx}`} className="aspect-[4/3] md:aspect-square" />;
                    }

                    const { day, dateStr } = cell;
                    const apiData = calendarData.find(c => c.date === dateStr);
                    const status = getDayStatus(dateStr);
                    const future = isFuture(dateStr);
                    const exists = apiData?.exists ?? false;

                    // Theme Logic
                    const activeThemeIndex = themes.findIndex(t => dateStr >= t.startDate && dateStr <= t.endDate);
                    const activeTheme = themes[activeThemeIndex];
                    const themeColors = activeTheme ? THEME_COLORS[activeThemeIndex % THEME_COLORS.length] : null;

                    return (
                        <button
                            key={dateStr}
                            disabled={future || !exists}
                            onClick={() => navigate(`/problem/${dateStr}`)}
                            className={`
                                relative group flex flex-col justify-between p-2 md:p-3 rounded-xl border transition-all duration-200 aspect-[4/3] md:aspect-square
                                ${future || !exists 
                                    ? 'bg-gray-900/30 border-gray-800/50 cursor-default opacity-50' 
                                    : 'bg-gray-900 border-gray-800 hover:border-indigo-500 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer'
                                }
                                ${activeTheme && !future ? `${themeColors?.bg} ${themeColors?.border} border-opacity-30` : ''}
                            `}
                        >
                            {/* Header: Date & Status */}
                            <div className="flex items-start justify-between w-full">
                                <span className={`text-sm md:text-lg font-bold font-mono ${future ? 'text-gray-700' : 'text-gray-300 group-hover:text-white'}`}>
                                    {day}
                                </span>
                                
                                {!future && exists && (
                                    <>
                                        {status === 'WON' && <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-green-500" />}
                                        {status === 'LOST' && <XCircle className="w-4 h-4 md:w-5 md:h-5 text-red-500" />}
                                        {status === 'PLAYING' && <div className="w-2 h-2 rounded-full bg-yellow-500 mt-1.5 mr-1.5" />}
                                    </>
                                )}
                            </div>

                            {/* Middle: Theme Indicator */}
                            {activeTheme && !future && (
                                <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 px-2 hidden lg:block">
                                    <div className={`text-[10px] font-bold uppercase tracking-wide truncate text-center py-1 rounded-full ${themeColors?.text} bg-gray-950/50 backdrop-blur border border-white/5`}>
                                        {activeTheme.theme}
                                    </div>
                                </div>
                            )}

                            {/* Footer: Difficulty Badge */}
                            {!future && exists ? (
                                <div className="mt-auto self-start w-full overflow-hidden">
                                    {apiData?.difficulty && (
                                        <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] md:text-[10px] font-bold uppercase border truncate max-w-full ${getDifficultyColor(apiData.difficulty)}`}>
                                            {apiData.difficulty}
                                        </span>
                                    )}
                                </div>
                            ) : (
                                <div className="mt-auto self-center text-gray-700">
                                    {future ? <Lock className="w-4 h-4" /> : <span className="text-[10px] md:text-xs">Empty</span>}
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Mobile Theme Legend */}
            <div className="mt-8 lg:hidden space-y-2">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Themes this Month</h3>
                {themes.map((t, i) => {
                     const colors = THEME_COLORS[i % THEME_COLORS.length];
                     return (
                         <div key={t.theme} className={`flex items-center gap-3 p-3 rounded-lg border ${colors.border} ${colors.bg}`}>
                             <Star className={`w-4 h-4 ${colors.text}`} />
                             <div className="flex-1">
                                 <div className={`text-sm font-bold ${colors.text}`}>{t.theme}</div>
                                 <div className="text-xs text-gray-400">{t.startDate} → {t.endDate}</div>
                             </div>
                         </div>
                     );
                })}
            </div>
            
            {loading && (
                <div className="absolute inset-0 bg-gray-950/80 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm font-mono text-indigo-400">Loading Archive...</span>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ArchiveView;