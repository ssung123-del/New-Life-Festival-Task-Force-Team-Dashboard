import React from 'react';
import { Bell, Megaphone } from 'lucide-react';
import { Schedule } from '../types';

interface NotificationCardProps {
  notices: Schedule[];
}

export const NotificationCard: React.FC<NotificationCardProps> = ({ notices }) => {
  if (!notices || notices.length === 0) return null;

  const formatDate = (date: string) => date.replace(/-/g, '.');

  return (
    <div className="glass-panel rounded-3xl p-6 md:p-8 relative overflow-hidden group hover:shadow-glow transition-all duration-500">
      {/* Decorative Background */}
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-yellow-400/20 rounded-full blur-2xl pointer-events-none"></div>

      <div className="flex items-center gap-2 mb-4 relative z-10">
        <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-full text-yellow-600 dark:text-yellow-400">
          <Bell size={18} fill="currentColor" className="animate-pulse-slow" />
        </div>
        <h3 className="font-bold text-[#1D1D1F] dark:text-white">공지사항</h3>
      </div>

      <div className="space-y-4 relative z-10">
        {notices.map((notice) => (
          <div key={notice.id} className="group flex gap-4 items-start p-4 rounded-2xl bg-gradient-to-br from-yellow-50 to-white dark:from-yellow-900/10 dark:to-[#2C2C2E] border border-yellow-100 dark:border-yellow-900/20 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/40 rounded-full shrink-0 group-hover:scale-110 transition-transform duration-300">
              <Megaphone size={16} className="text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-[15px] font-bold text-gray-900 dark:text-gray-100 leading-snug mb-1">
                {notice.content}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium tracking-wide">
                {notice.startDate === notice.endDate
                  ? formatDate(notice.startDate)
                  : `${formatDate(notice.startDate)} ~ ${formatDate(notice.endDate)}`}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};