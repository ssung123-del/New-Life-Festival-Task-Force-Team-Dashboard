import React from 'react';
import { DateStatus } from '../types';

interface StatusBadgeProps {
  status: DateStatus;
  dDay?: number;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, dDay }) => {
  const getStyles = (s: DateStatus) => {
    switch (s) {
      case 'Active':
        return 'bg-blue-100 text-blue-700 border-blue-200 animate-pulse';
      case 'Upcoming':
        return 'bg-orange-50 text-orange-600 border-orange-200';
      case 'Past':
        return 'bg-gray-100 text-gray-400 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-500';
    }
  };

  const getLabel = () => {
    if (status === 'Active') return '진행 중 (ON)';
    if (status === 'Upcoming') return dDay ? `D-${dDay}` : '예정';
    return '종료됨';
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStyles(status)}`}>
      {getLabel()}
    </span>
  );
};