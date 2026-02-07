export enum Priority {
  High = 'High',
  Medium = 'Medium',
  Low = 'Low'
}

// Derived automatically based on date, not stored in DB manually
export type DateStatus = 'Active' | 'Upcoming' | 'Past';

export interface Schedule {
  id: string;
  startDate: string; // ISO Date string YYYY-MM-DD
  endDate: string;   // ISO Date string YYYY-MM-DD
  content: string;
  priority: Priority;
  // status field is removed from interface as it's now derived, 
  // but we keep 'category' matching the sheet columns.
  category?: string;
  // Optional: keep track of row index or legacy status if needed, but simplified here.
}

export interface DashboardStats {
  total: number;
  active: number;
  upcoming: number;
  past: number;
}