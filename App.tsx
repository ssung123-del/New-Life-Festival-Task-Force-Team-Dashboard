import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, LayoutGrid, RotateCw, LogOut, Download, CalendarCheck, Lock, Unlock, Moon, Sun, AlertTriangle } from 'lucide-react';
import { ministryService } from './services/ministryService';
import { Schedule, DashboardStats, DateStatus } from './types';
import { Card } from './components/Card';
import { ScheduleItem } from './components/ScheduleItem';
import { NewScheduleModal } from './components/NewScheduleModal';
import { EditScheduleModal } from './components/EditScheduleModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { NotificationCard } from './components/NotificationCard';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

// Helper to calculate status based on today's date
// Safely parses YYYY-MM-DD to avoid timezone shifts
const getDateStatus = (startDate: string, endDate: string): { status: DateStatus; dDay?: number } => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Parse YYYY-MM-DD manually to treat it as local date
  const parseDate = (dateStr: string) => {
    const parts = dateStr.split('-').map(Number);
    // new Date(y, m-1, d) uses local time
    return new Date(parts[0], parts[1] - 1, parts[2]);
  };

  const start = parseDate(startDate);
  start.setHours(0, 0, 0, 0);

  const end = parseDate(endDate);
  end.setHours(23, 59, 59, 999);

  if (today >= start && today <= end) {
    return { status: 'Active' };
  } else if (today < start) {
    const diffTime = Math.abs(start.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return { status: 'Upcoming', dDay: diffDays };
  } else {
    return { status: 'Past' };
  }
};

const getMonthTheme = (month: number) => {
  switch (month) {
    case 2: return "기획 단계 (Planning)";
    case 3: return "제작 및 발주 (Production)";
    case 4: return "동기부여 (Motivation)";
    case 5: return "새생명 축제 일정";
    default: return `${month}월 사역`;
  }
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => ministryService.isAuthenticated());
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);

  // Admin State
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hms_dark_mode');
      return saved === 'true' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [filter, setFilter] = useState<DateStatus | 'All'>('All');
  const [error, setError] = useState<string | null>(null);

  // Dark Mode Effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('hms_dark_mode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('hms_dark_mode', 'false');
    }
  }, [isDarkMode]);

  // Initial Fetch
  useEffect(() => {
    ministryService.checkUrlParams();
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ministryService.getSchedules();
      setSchedules(data);
      setIsAuthenticated(true);
    } catch (error: any) {
      console.error("Fetch failed:", error.message);

      if (error.message === "Backend URL not found" || error.message === "Not connected") {
        setError("연결된 URL이 없습니다. ministryService.ts 파일에 Apps Script URL을 입력했는지 확인해주세요.");
      } else {
        setError(error.message || "데이터를 불러오는데 실패했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = ['ID', 'StartDate', 'EndDate', 'Content', 'Priority', 'Status(Legacy)', 'Category'];
    const rows = [
      ['sample_1', '2024-02-01', '2024-02-05', '예시: 기획 회의', 'High', '-', 'Planning'],
      ['sample_notice', '2024-03-01', '2024-03-31', '예시: 공지사항 내용', 'High', '-', 'Notice'],
    ];

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ministry_schedule_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddSchedule = async (newSchedule: Omit<Schedule, 'id'>) => {
    try {
      const added = await ministryService.addSchedule(newSchedule);
      setSchedules(prev => {
        const updated = [added, ...prev];
        return updated.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
      });
    } catch (error) {
      console.error("Failed to add schedule", error);
      alert("일정 추가 실패: 네트워크 상태나 서버 로그를 확인하세요.");
    }
  };

  const handleUpdateSchedule = async (updatedSchedule: Schedule) => {
    try {
      // Optimistic Update & Resort
      setSchedules(prev => {
        const updated = prev.map(s => s.id === updatedSchedule.id ? updatedSchedule : s);
        return updated.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
      });
      await ministryService.updateSchedule(updatedSchedule);
    } catch (error) {
      console.error("Failed to update schedule", error);
      alert("일정 수정 실패: 네트워크 상태나 서버 로그를 확인하세요.");
      fetchData(); // Revert on error
    }
  };

  // Split Schedules into Regular and Notices
  const { regularSchedules, notices } = useMemo(() => {
    const regular: Schedule[] = [];
    const notes: Schedule[] = [];

    schedules.forEach(s => {
      // Check for 'Notice' or '공지' in category (case insensitive)
      const isNotice = s.category && ['notice', '공지', 'notification', '알림'].includes(s.category.toLowerCase().trim());
      if (isNotice) {
        notes.push(s);
      } else {
        regular.push(s);
      }
    });

    return { regularSchedules: regular, notices: notes };
  }, [schedules]);

  // Process schedules with derived status
  const processedSchedules = useMemo(() => {
    return regularSchedules.map(s => ({
      ...s,
      ...getDateStatus(s.startDate, s.endDate)
    }));
  }, [regularSchedules]);

  const stats: DashboardStats = useMemo(() => {
    const total = processedSchedules.length;
    const active = processedSchedules.filter(s => s.status === 'Active').length;
    const upcoming = processedSchedules.filter(s => s.status === 'Upcoming').length;
    const past = processedSchedules.filter(s => s.status === 'Past').length;
    return { total, active, upcoming, past };
  }, [processedSchedules]);

  const filteredSchedules = useMemo(() => {
    if (filter === 'All') return processedSchedules;
    return processedSchedules.filter(s => s.status === filter);
  }, [processedSchedules, filter]);

  // Group by Month
  const groupedSchedules = useMemo(() => {
    const groups: { [key: string]: typeof filteredSchedules } = {};

    filteredSchedules.forEach(schedule => {
      // Use string splitting instead of Date object to ensure month is correct regardless of timezone
      // schedule.startDate is guaranteed to be YYYY-MM-DD by ministryService
      if (!schedule.startDate) return;

      const parts = schedule.startDate.split('-');
      if (parts.length < 2) return;

      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]);

      const key = `${year}-${month}`;

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(schedule);
    });

    // Sort keys (months)
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      const [yearA, monthA] = a.split('-').map(Number);
      const [yearB, monthB] = b.split('-').map(Number);
      return yearA - yearB || monthA - monthB;
    });

    return sortedKeys.map(key => ({
      key,
      year: key.split('-')[0],
      month: parseInt(key.split('-')[1]),
      items: groups[key]
    }));
  }, [filteredSchedules]);

  const chartData = [
    { name: 'Active', value: stats.active, color: '#3B82F6' },   // Blue
    { name: 'Upcoming', value: stats.upcoming, color: '#F97316' }, // Orange
    { name: 'Past', value: stats.past, color: '#9CA3AF' },      // Gray
  ].filter(d => d.value > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F2F2F7] to-[#E5E5EA] dark:from-[#000000] dark:to-[#1C1C1E] text-[#1D1D1F] dark:text-gray-100 p-8 md:p-16 font-sans selection:bg-brand-500/30 dark:selection:bg-brand-400/30 transition-colors duration-500">

      {/* Header */}
      <header className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-3 mb-3 animate-fade-in">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-500"></span>
            </span>
            <h2 className="text-sm font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest">
              2026 Oryun Church New Life Festival Task Force
            </h2>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#1D1D1F] to-[#48484A] dark:from-white dark:to-gray-400 break-keep leading-tight drop-shadow-sm animate-slide-up">
            새생명축제 TF팀<br />사역 대시보드
          </h1>
          <div className="mt-4 flex items-center gap-3">
            <p className="text-lg text-gray-500 dark:text-gray-400 font-medium">Data-Driven Ministry Management System</p>
            {isAdmin && <span className="text-xs bg-gradient-to-r from-red-500 to-pink-600 text-white px-3 py-1 rounded-full font-bold shadow-lg shadow-pink-500/30 animate-pulse-slow">ADMIN ACCESS GRANTED</span>}
          </div>
        </div>

        {/* Toolbar - Dynamic based on Admin State */}
        <div className="flex items-center gap-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className={`flex items-center glass-panel rounded-full p-2.5 shadow-xl shadow-black/5 dark:shadow-black/20 transition-all hover:scale-105`}>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#2C2C2E] rounded-full transition-all"
              title={isDarkMode ? "라이트 모드로 전환" : "다크 모드로 전환"}
            >
              {isDarkMode ? <Sun size={20} strokeWidth={2} /> : <Moon size={20} strokeWidth={2} />}
            </button>

            <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1"></div>

            {/* Refresh */}
            <button
              onClick={fetchData}
              className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-[#2C2C2E] rounded-full transition-all"
              title="새로고침"
            >
              <RotateCw size={20} className={loading ? "animate-spin" : ""} strokeWidth={2} />
            </button>

            {/* Admin Controls */}
            {isAdmin && (
              <>
                <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1"></div>
                <button
                  onClick={handleDownloadTemplate}
                  className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#2C2C2E] rounded-full transition-all"
                  title="템플릿 다운로드"
                >
                  <Download size={20} strokeWidth={2} />
                </button>
              </>
            )}

            <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1"></div>

            {/* Admin Toggle */}
            {isAdmin ? (
              <button
                onClick={() => setIsAdmin(false)}
                className="p-2.5 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-full transition-all"
                title="관리자 모드 종료"
              >
                <Unlock size={20} strokeWidth={2} />
              </button>
            ) : (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="p-2.5 text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#2C2C2E] rounded-full transition-all"
                title="관리자 모드 진입"
              >
                <Lock size={20} strokeWidth={2} />
              </button>
            )}
          </div>

          {/* Admin Only: Add Button */}
          {isAdmin && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-brand-600 dark:bg-brand-500 text-white pl-6 pr-8 py-4 rounded-full font-bold flex items-center gap-3 hover:bg-brand-700 dark:hover:bg-brand-400 transition-all shadow-xl shadow-brand-500/30 hover:shadow-brand-500/50 active:scale-95 animate-fade-in group"
            >
              <Plus size={24} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-300" />
              <span className="hidden md:inline">일정 추가</span>
              <span className="md:hidden">추가</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Grid */}
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8"
      >

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="lg:col-span-12 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 px-6 py-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="flex items-start md:items-center gap-3">
              <AlertTriangle className="shrink-0 mt-1 md:mt-0" />
              <span className="font-medium">{error}</span>
            </div>
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-200 rounded-lg text-sm font-bold hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors whitespace-nowrap"
            >
              다시 시도
            </button>
          </motion.div>
        )}

        {/* Left Column: Schedule List (8 cols) */}
        <section className="lg:col-span-8 space-y-6">
          <Card
            title={filter === 'All' ? '전체 사역 일정' : filter === 'Active' ? '진행 중인 사역' : filter === 'Upcoming' ? '다가오는 사역' : '지난 사역'}
            action={
              <div className="flex bg-gray-100 dark:bg-[#2C2C2E] p-1 rounded-lg">
                <button
                  onClick={() => setFilter('All')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${filter === 'All' ? 'bg-white dark:bg-[#3A3A3C] text-black dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
                >
                  전체
                </button>
                <button
                  onClick={() => setFilter('Active')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${filter === 'Active' ? 'bg-white dark:bg-[#3A3A3C] text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
                >
                  진행 중
                </button>
                <button
                  onClick={() => setFilter('Upcoming')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${filter === 'Upcoming' ? 'bg-white dark:bg-[#3A3A3C] text-orange-600 dark:text-orange-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
                >
                  예정
                </button>
                <button
                  onClick={() => setFilter('Past')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${filter === 'Past' ? 'bg-white dark:bg-[#3A3A3C] text-gray-600 dark:text-gray-300 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
                >
                  종료
                </button>
              </div>
            }
          >
            {loading ? (
              <div className="space-y-4 py-8">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse flex items-center p-4 rounded-2xl bg-gray-50 dark:bg-[#2C2C2E] border border-gray-100 dark:border-[#38383A]">
                    <div className="w-1.5 h-10 bg-gray-200 dark:bg-gray-700 rounded-full mr-4"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredSchedules.length > 0 ? (
              <motion.div layout className="space-y-12">
                <AnimatePresence mode='popLayout'>
                  {groupedSchedules.map((group) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.4 }}
                      key={group.key}
                      className="space-y-4 relative"
                    >
                      {/* Month Header - Apple Style Gradient & Underline */}
                      <div className="sticky top-0 bg-[#F2F2F7]/80 dark:bg-black/60 backdrop-blur-xl z-20 py-6 -mx-8 px-8 mb-6 border-b border-gray-200/50 dark:border-white/5 transition-all">
                        <div className="flex flex-col gap-2 relative">
                          <div className="flex items-baseline gap-4 z-10">
                            <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-purple-600 dark:from-brand-400 dark:to-purple-400 drop-shadow-sm">
                              {group.month}월
                            </span>
                            <h4 className="text-xl font-bold text-[#1D1D1F]/80 dark:text-white/80">
                              {getMonthTheme(group.month)}
                            </h4>
                          </div>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="grid gap-4 pl-1">
                        {group.items.map((schedule) => (
                          <ScheduleItem
                            key={schedule.id}
                            schedule={schedule}
                            status={schedule.status}
                            dDay={schedule.dDay}
                            onEdit={isAdmin ? setEditingSchedule : undefined}
                          />
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <div className="text-center py-20 text-gray-400 dark:text-gray-600">
                <div className="mb-4 flex justify-center"><LayoutGrid size={48} className="opacity-20" /></div>
                <p>
                  {schedules.length === 0 && !error
                    ? "등록된 일정이 없습니다."
                    : "해당 조건의 일정이 없습니다."}
                </p>
              </div>
            )}
          </Card>
        </section>

        {/* Right Column: Stats & Summary (4 cols) */}
        <aside className="lg:col-span-4 space-y-6">

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 100, delay: 0.3 }}
            className="bg-gradient-to-br from-blue-600 to-indigo-700 dark:from-blue-900 dark:to-indigo-900 text-white p-8 rounded-3xl shadow-xl shadow-blue-900/20 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full filter blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none -mr-16 -mt-16"></div>

            <h3 className="text-lg font-medium mb-2 text-white/80">오늘 진행 중인 사역</h3>
            <div className="flex items-baseline gap-2 mb-6">
              <p className="text-6xl font-black tracking-tight">{stats.active}</p>
              <span className="text-lg text-white/70">건</span>
            </div>

            <div className="border-t border-white/10 pt-4 mt-auto">
              <div className="flex items-center gap-2 text-white/90">
                <CalendarCheck size={18} />
                <span className="text-sm font-medium">오늘은 사역에 집중하는 날!</span>
              </div>
            </div>
          </motion.div>

          {/* New Notification Component */}
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <NotificationCard notices={notices} />
          </motion.div>

          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Card title="사역 분포" className="min-h-[300px]">
              <div className="h-[200px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        backgroundColor: isDarkMode ? '#1C1C1E' : '#FFFFFF',
                        color: isDarkMode ? '#FFFFFF' : '#000000'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <span className="block text-3xl font-black text-[#1D1D1F] dark:text-white">{stats.total}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Total</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex justify-between items-center text-sm p-2 hover:bg-gray-50 dark:hover:bg-[#2C2C2E] rounded-lg transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500 shadow shadow-blue-500/50" />
                    <span className="text-gray-600 dark:text-gray-300 font-medium">진행 중 (Active)</span>
                  </div>
                  <span className="font-bold text-[#1D1D1F] dark:text-white">{stats.active}</span>
                </div>
                <div className="flex justify-between items-center text-sm p-2 hover:bg-gray-50 dark:hover:bg-[#2C2C2E] rounded-lg transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500 shadow shadow-orange-500/50" />
                    <span className="text-gray-600 dark:text-gray-300 font-medium">예정 (Upcoming)</span>
                  </div>
                  <span className="font-bold text-[#1D1D1F] dark:text-white">{stats.upcoming}</span>
                </div>
                <div className="flex justify-between items-center text-sm p-2 hover:bg-gray-50 dark:hover:bg-[#2C2C2E] rounded-lg transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-400 dark:bg-gray-600" />
                    <span className="text-gray-600 dark:text-gray-300 font-medium">종료 (Past)</span>
                  </div>
                  <span className="font-bold text-[#1D1D1F] dark:text-white">{stats.past}</span>
                </div>
              </div>
            </Card>
          </motion.div>

        </aside>
      </motion.main>

      <NewScheduleModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddSchedule}
      />

      <EditScheduleModal
        isOpen={!!editingSchedule}
        onClose={() => setEditingSchedule(null)}
        onSubmit={handleUpdateSchedule}
        initialData={editingSchedule}
      />

      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={() => setIsAdmin(true)}
      />
    </div>
  );
}

export default App;