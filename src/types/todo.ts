export type PriorityLevel = 'low' | 'medium' | 'high';

export interface Subtask {
  id: string;
  text: string;
  completed: boolean;
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  completedAt?: number;
  priority: PriorityLevel;
  category: string;
  dueDate?: string; // YYYY-MM-DD format
  pinned?: boolean;
  notes?: string;
  subtasks?: Subtask[];
}

export type FilterType = 'all' | 'active' | 'completed' | 'starred';

export type SortType = 'manual' | 'date-newest' | 'date-oldest' | 'priority' | 'alphabetical';

export type ThemePreset = 'sunset' | 'ocean' | 'aurora' | 'lavender' | 'slate';
