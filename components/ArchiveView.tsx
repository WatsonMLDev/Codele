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

// Theme styles from Admin UI
const THEME_STYLES = [
  { border: '#d29922', bg: 'rgba(210, 153, 34, 0.15)', text: '#d29922' }, // Yellow
  { border: '#58a6ff', bg: 'rgba(88, 166, 255, 0.15)', text: '#58a6ff' }, // Blue
  { border: '#3fb950', bg: 'rgba(63, 185, 80, 0.15)', text: '#3fb950' }, // Green
  { border: '#f85149', bg: 'rgba(248, 81, 73, 0.15)', text: '#f85149' }, // Red
  { border: '#bc8cff', bg: 'rgba(188, 140, 255, 0.15)', text: '#bc8cff' }, // Purple
  { border: '#db61a2', bg: 'rgba(219, 97, 162, 0.15)', text: '#db61a2' }, // Pink
  { border: '#f0883e', bg: 'rgba(240, 136, 62, 0.15)', text: '#f0883e' }, // Orange
  { border: '#39c5bb', bg: 'rgba(57, 197, 187, 0.15)', text: '#39c5bb' }, // Cyan/Teal
];

const getThemeStyle = (index: number) => THEME_STYLES[index % THEME_STYLES.length];

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

    const days: ({ day: number; dateStr: string } | null)[] = [];

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

  // Chunk grid into weeks for theme segment calculation
  const gridWeeks = useMemo(() => {
    const weeks = [];
    for (let i = 0; i < gridDays.length; i += 7) {
      weeks.push(gridDays.slice(i, i + 7));
    }
    return weeks;
  }, [gridDays]);

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
    now.setHours(0, 0, 0, 0);
    return d > now;
  };

  // Get status from local storage
  const getDayState = (dateStr: string) => {
    return StorageService.loadGameState(dateStr);
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
              className={`p-1.5 rounded transition-colors ${year === new Date().getFullYear() && month === new Date().getMonth()
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

          {/* Calendar Grid & Theme Overlays */}
          <div className="space-y-6 md:space-y-8">
            {gridWeeks.map((week, weekIdx) => {
              // Calculate segments of consecutive theme days in this week
              const segments: { theme: WeeklyTheme; start: number; end: number; style: any }[] = [];
              let currentSegment: { theme: WeeklyTheme; start: number; style: any } | null = null;

              week.forEach((cell, dayIdx) => {
                if (cell) {
                  const themeIndex = themes.findIndex(t => cell.dateStr >= t.startDate && cell.dateStr <= t.endDate);
                  const theme = themes[themeIndex];
                  if (theme) {
                    if (!currentSegment || currentSegment.theme.theme !== theme.theme) {
                      if (currentSegment) {
                        segments.push({ ...currentSegment, end: dayIdx - 1 });
                      }
                      currentSegment = { theme, start: dayIdx, style: getThemeStyle(themeIndex) };
                    }
                  } else if (currentSegment) {
                    segments.push({ ...currentSegment, end: dayIdx - 1 });
                    currentSegment = null;
                  }
                } else if (currentSegment) {
                  segments.push({ ...currentSegment, end: dayIdx - 1 });
                  currentSegment = null;
                }
              });
              if (currentSegment) {
                segments.push({ ...currentSegment, end: week.length - 1 });
              }

              return (
                <div key={`week-${weekIdx}`} className="relative">
                  {/* Theme Labels Row (matching Admin UI) */}
                  <div className="flex gap-2 mb-1 pl-1 min-h-[24px]">
                    {segments.map((seg, sIdx) => {
                      // Only show labels for segments that START here or are the first in the month
                      const cell = week[seg.start];
                      const isStartOfTheme = cell && cell.dateStr === seg.theme.startDate;
                      const isStartOfWeek = seg.start === 0 || !week[seg.start - 1];

                      if (isStartOfTheme || isStartOfWeek) {
                        return (
                          <div
                            key={`label-${weekIdx}-${sIdx}`}
                            className="flex items-center gap-1.5 px-3 py-0.5 rounded-full border-2 bg-gray-950 text-[10px] md:text-xs font-bold transition-all"
                            style={{ borderColor: seg.style.border, color: seg.style.text }}
                          >
                            <Star className="w-3 h-3" />
                            <span>{seg.theme.theme}</span>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>

                  {/* Calendar Row Container */}
                  <div className="relative">
                    {/* Background Grid Layer (Theme Borders) */}
                    <div className="absolute -inset-1 z-0 pointer-events-none grid grid-cols-7 gap-2 md:gap-4">
                      {segments.map((seg, sIdx) => (
                        <div
                          key={`bg-seg-${weekIdx}-${sIdx}`}
                          className="rounded-xl border-2 transition-all duration-500 opacity-90"
                          style={{
                            gridColumnStart: seg.start + 1,
                            gridColumnEnd: seg.end + 2,
                            borderColor: seg.style.border,
                            backgroundColor: seg.style.bg,
                            boxShadow: `0 0 15px ${seg.style.border}20`
                          }}
                        />
                      ))}
                    </div>

                    {/* Foreground Grid Layer (Interactive Cells) */}
                    <div className="grid grid-cols-7 gap-2 md:gap-4 relative z-10">
                      {week.map((cell, dayIdx) => {
                        if (!cell) {
                          return <div key={`pad-${weekIdx}-${dayIdx}`} className="aspect-[4/3] md:aspect-square" />;
                        }

                        const { day, dateStr } = cell;
                        const apiData = Array.isArray(calendarData) ? calendarData.find(c => c.date === dateStr) : undefined;
                        const state = getDayState(dateStr);
                        const future = isFuture(dateStr);
                        const exists = !!apiData;

                        const isWon = state?.gameState === 'WON';
                        const isLost = state?.gameState === 'LOST';
                        const isStarted = state?.gameState === 'PLAYING' && (state?.attempts?.length || 0) > 0;
                        const attemptsCount = state?.attempts?.length || 0;

                        return (
                          <button
                            key={dateStr}
                            disabled={future || !exists}
                            onClick={() => navigate(`/problem/${dateStr}`)}
                            className={`
                              relative group flex flex-col justify-between p-2 md:p-3 rounded-xl border transition-all duration-200 aspect-[4/3] md:aspect-square text-left
                              ${future || !exists
                                ? 'bg-gray-900/40 border-gray-800/60 cursor-default opacity-60' // Lighter empty state
                                : 'bg-gray-800/40 border-gray-700/80 hover:bg-gray-800/60 hover:border-indigo-500/50 hover:shadow-xl hover:-translate-y-1 cursor-pointer' // Lighter active state
                              }
                            `}
                          >
                            {/* Header: Date & Status */}
                            <div className="flex items-start justify-between w-full mb-1">
                              <span className={`text-xs md:text-sm font-bold font-mono ${future ? 'text-gray-700' : 'text-gray-500 group-hover:text-gray-300'}`}>
                                {day}
                              </span>

                              {!future && exists && (
                                <>
                                  {isWon && <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-green-500" />}
                                  {isLost && <XCircle className="w-3 h-3 md:w-4 md:h-4 text-red-500" />}
                                </>
                              )}
                            </div>

                            {/* Middle: Title */}
                            {!future && exists && apiData?.title && (
                              <div className="flex-1 min-h-0 w-full flex flex-col gap-1">
                                <div className="text-[10px] md:text-xs font-medium text-gray-300 group-hover:text-white line-clamp-2 leading-tight">
                                  {apiData.title}
                                </div>

                                {/* Detailed Status Text */}
                                {isStarted && (
                                  <div className="text-[10px] font-mono text-yellow-500 font-bold">
                                    Started ({attemptsCount}/6)
                                  </div>
                                )}
                                {isWon && (
                                  <div className="text-[10px] font-mono text-green-400 font-bold">
                                    Solved
                                  </div>
                                )}
                                {isLost && (
                                  <div className="text-[10px] font-mono text-red-400 font-bold">
                                    Failed
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Footer: Difficulty Badge */}
                            {!future && exists ? (
                              <div className="mt-2 self-start w-full overflow-hidden">
                                {apiData?.difficulty && (
                                  <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border truncate max-w-full ${getDifficultyColor(apiData.difficulty)}`}>
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