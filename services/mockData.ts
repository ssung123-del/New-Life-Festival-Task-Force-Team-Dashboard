import { Schedule, Priority } from '../types';

export const INITIAL_SCHEDULES: Schedule[] = [
  {
    id: 'demo-1',
    startDate: '2026-02-01',
    endDate: '2026-02-28',
    content: '새생명축제 기획안 확정 및 팀 구성',
    priority: Priority.High,
    category: 'General'
  },
  {
    id: 'demo-2',
    startDate: '2026-03-10',
    endDate: '2026-03-15',
    content: '홍보 영상 촬영 및 제작 시작',
    priority: Priority.Medium,
    category: 'General'
  },
  {
    id: 'demo-3',
    startDate: '2026-03-20',
    endDate: '2026-03-20',
    content: '전체 교구 연합 기도회',
    priority: Priority.High,
    category: 'Notice'
  },
  {
    id: 'demo-4',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    content: '중간 점검 회의 (데모 데이터)',
    priority: Priority.Medium,
    category: 'General'
  }
];