import React from 'react';
import { Schedule, Priority, DateStatus } from '../types';
import { Calendar, Edit2 } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

interface ScheduleItemProps {
  schedule: Schedule;
  status: DateStatus;
  dDay?: number;
  onEdit?: (schedule: Schedule) => void;
}

export const ScheduleItem: React.FC<ScheduleItemProps> = ({ schedule, status, dDay, onEdit }) => {
  const getPriorityColor = (p: Priority) => {
    switch (p) {
      case Priority.High: return 'bg-[#FF3B30]'; // Apple Red
      case Priority.Medium: return 'bg-[#FF9500]'; // Apple Orange
      case Priority.Low: return 'bg-[#34C759]'; // Apple Green
      default: return 'bg-gray-400';
    }
  };

  const isPast = status === 'Past';
  const isActive = status === 'Active';

  // Display dates with dots instead of hyphens for aesthetics
  const displayStart = schedule.startDate.replace(/-/g, '.');
  const displayEnd = schedule.endDate.replace(/-/g, '.');

  return (
    <div
      className={`group flex items-center justify-between p-5 -mx-4 md:mx-0 rounded-2xl transition-all duration-500 border relative
        ${isActive
          ? 'bg-white dark:bg-[#1C1C1E] border-brand-500/50 dark:border-brand-400/50 shadow-lg shadow-brand-500/20 scale-[1.02] z-10'
          : isPast
            ? 'bg-transparent border-transparent opacity-50 hover:opacity-80 grayscale-[0.5]'
            : 'bg-white/40 dark:bg-[#1C1C1E]/40 border-white/20 dark:border-white/5 hover:bg-white/60 dark:hover:bg-[#1C1C1E]/60 hover:shadow-lg hover:border-brand-200/50 dark:hover:border-brand-800/50 transform hover:-translate-x-1'
        }
      `}
    >
      <div className="flex gap-5 items-center w-full">
        {/* Priority Indicator */}
        <div className={`w-1.5 h-12 ${getPriorityColor(schedule.priority)} rounded-full shadow-[0_0_10px_rgba(0,0,0,0.1)] transition-all group-hover:h-14 group-hover:w-2 ${isPast ? 'grayscale opacity-50' : ''}`} />

        <div className="flex flex-col flex-1">
          <div className="flex justify-between items-start">
            <div className="flex-1 pr-8">
              <h4 className={`font-semibold text-[17px] leading-tight mb-1.5 ${isActive ? 'text-blue-900 dark:text-blue-100' : 'text-[#1D1D1F] dark:text-gray-100'}`}>
                {schedule.content}
              </h4>
              <div className="flex items-center gap-2">
                <StatusBadge status={status} dDay={dDay} />
              </div>
            </div>

            {/* Edit Button - Visible on Hover or Active */}
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(schedule);
                }}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-[#3A3A3C] dark:hover:text-blue-400 rounded-full transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 absolute top-4 right-4"
                title="수정"
              >
                <Edit2 size={16} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-2">
            <div className="flex items-center gap-1.5">
              <Calendar size={14} className={isActive ? 'text-blue-500 dark:text-blue-400' : ''} />
              <span className={isActive ? 'font-medium text-blue-600 dark:text-blue-400' : ''}>
                {displayStart} ~ {displayEnd}
              </span>
            </div>
            {schedule.category && (
              <div className="hidden sm:flex items-center gap-1.5 text-xs bg-gray-100 dark:bg-[#3A3A3C] px-2 py-0.5 rounded text-gray-500 dark:text-gray-300">
                <span>{schedule.category}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};