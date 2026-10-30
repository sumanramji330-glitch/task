/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AnimatePresence } from 'motion/react';
import { 
  Search, 
  Settings, 
  CheckCheck, 
  Sparkles, 
  Undo2, 
  SlidersHorizontal,
  X
} from 'lucide-react';

import { TodoItem, FilterType, PriorityLevel, SortType, ThemePreset } from './types/todo';
import { TaskItem } from './components/TaskItem';
import { TaskInput } from './components/TaskInput';
import { SettingsModal } from './components/SettingsModal';
import { playSound } from './utils/audio';
import { fireConfetti } from './utils/confetti';

const STORAGE_KEY = 'modern_todo_items_v2';
const SOUND_KEY = 'modern_todo_sound_pref';
const THEME_KEY = 'modern_todo_theme_pref';

const INITIAL_TODOS: TodoItem[] = [
  {
    id: 'demo-1',
    text: 'Design user onboarding journey',
    completed: false,
    createdAt: Date.now() - 3600000 * 5,
    priority: 'high',
    category: 'Work',
    pinned: true,
    dueDate: new Date().toISOString().split('T')[0],
    subtasks: [
      { id: 'st-1', text: 'Wireframe welcome screen', completed: true },
      { id: 'st-2', text: 'Draft value proposition copy', completed: false },
    ]
  },
  {
    id: 'demo-2',
    text: 'Review quarterly team priorities & roadmap',
    completed: false,
    createdAt: Date.now() - 3600000 * 3,
    priority: 'medium',
    category: 'Work',
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0]
  },
  {
    id: 'demo-3',
    text: 'Schedule 30-minute afternoon walk & hydrate',
    completed: true,
    createdAt: Date.now() - 3600000 * 8,
    completedAt: Date.now() - 3600000 * 2,
    priority: 'low',
    category: 'Health',
    dueDate: new Date().toISOString().split('T')[0]
  },
  {
    id: 'demo-4',
    text: 'Pick up fresh fruits and matcha powder',
    completed: false,
    createdAt: Date.now() - 3600000 * 2,
    priority: 'low',
    category: 'Shopping'
  }
];

export default function App() {
  const [todos, setTodos] = useState<TodoItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return INITIAL_TODOS;
  });

  const [currentFilter, setCurrentFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortType>('manual');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem(SOUND_KEY) !== 'false';
  });
  const [theme, setTheme] = useState<ThemePreset>(() => {
    return (localStorage.getItem(THEME_KEY) as ThemePreset) || 'sunset';
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [recentlyDeleted, setRecentlyDeleted] = useState<{ item: TodoItem; index: number } | null>(null);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    } catch {
      // storage quota or private mode
    }
  }, [todos]);

  useEffect(() => {
    localStorage.setItem(SOUND_KEY, String(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  // Global keyboard shortcuts: '/' to focus search, 'Escape' to clear search / cancel edit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Actions
  const handleAddTodo = (text: string, priority: PriorityLevel, category: string, dueDate: string) => {
    const newTodo: TodoItem = {
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      text,
      completed: false,
      createdAt: Date.now(),
      priority,
      category,
      dueDate: dueDate || undefined,
      subtasks: []
    };

    setTodos((prev) => [newTodo, ...prev]);
    playSound.pop(soundEnabled);

    // If viewing completed tasks only, switch back to 'all' so user sees the newly added active task
    if (currentFilter === 'completed') {
      setCurrentFilter('all');
    }
  };

  const handleToggleTodo = (id: string) => {
    setTodos((prev) => {
      const target = prev.find((t) => t.id === id);
      const isNowCompleted = !target?.completed;

      if (isNowCompleted) {
        playSound.complete(soundEnabled);

        // Check if all active tasks are now done -> Celebrate!
        const remainingActive = prev.filter((t) => t.id !== id && !t.completed).length;
        if (remainingActive === 0) {
          setTimeout(() => fireConfetti(), 150);
        }
      } else {
        playSound.uncheck(soundEnabled);
      }

      return prev.map((t) =>
        t.id === id
          ? {
              ...t,
              completed: isNowCompleted,
              completedAt: isNowCompleted ? Date.now() : undefined,
            }
          : t
      );
    });
  };

  const handleDeleteTodo = (id: string) => {
    const targetIndex = todos.findIndex((t) => t.id === id);
    const targetItem = todos[targetIndex];
    if (!targetItem) return;

    playSound.delete(soundEnabled);

    // Provide quick undo capability
    setRecentlyDeleted({ item: targetItem, index: targetIndex });
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    undoTimeoutRef.current = setTimeout(() => {
      setRecentlyDeleted(null);
    }, 5500);

    setTodos((prev) => prev.filter((t) => t.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const handleUndoDelete = () => {
    if (!recentlyDeleted) return;
    setTodos((prev) => {
      const updated = [...prev];
      updated.splice(recentlyDeleted.index, 0, recentlyDeleted.item);
      return updated;
    });
    setRecentlyDeleted(null);
    playSound.pop(soundEnabled);
  };

  const handleStartEdit = (id: string) => {
    setEditingId(id);
  };

  const handleSaveEdit = (
    id: string,
    newText: string,
    priority?: PriorityLevel,
    category?: string,
    dueDate?: string
  ) => {
    setTodos((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              text: newText,
              priority: priority || t.priority,
              category: category || t.category,
              dueDate: dueDate !== undefined ? dueDate || undefined : t.dueDate,
            }
          : t
      )
    );
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleToggleStar = (id: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, pinned: !t.pinned } : t))
    );
  };

  const handleToggleSubtask = (todoId: string, subtaskId: string) => {
    setTodos((prev) =>
      prev.map((t) => {
        if (t.id !== todoId) return t;
        const subtasks = (t.subtasks || []).map((st) =>
          st.id === subtaskId ? { ...st, completed: !st.completed } : st
        );
        return { ...t, subtasks };
      })
    );
  };

  const handleAddSubtask = (todoId: string, text: string) => {
    setTodos((prev) =>
      prev.map((t) => {
        if (t.id !== todoId) return t;
        const newSt = {
          id: `st-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          text,
          completed: false,
        };
        return { ...t, subtasks: [...(t.subtasks || []), newSt] };
      })
    );
  };

  const handleDeleteSubtask = (todoId: string, subtaskId: string) => {
    setTodos((prev) =>
      prev.map((t) => {
        if (t.id !== todoId) return t;
        return {
          ...t,
          subtasks: (t.subtasks || []).filter((st) => st.id !== subtaskId),
        };
      })
    );
  };

  const handleClearCompleted = () => {
    const count = todos.filter((t) => t.completed).length;
    if (count === 0) return;
    setTodos((prev) => prev.filter((t) => !t.completed));
    playSound.delete(soundEnabled);
  };

  const handleMarkAllComplete = () => {
    const hasUncompleted = todos.some((t) => !t.completed);
    if (!hasUncompleted) return;
    setTodos((prev) =>
      prev.map((t) => ({
        ...t,
        completed: true,
        completedAt: t.completed ? t.completedAt : Date.now(),
      }))
    );
    playSound.complete(soundEnabled);
    fireConfetti();
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(todos, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `tasks_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed)) {
            setTodos(parsed);
            setIsSettingsOpen(false);
            playSound.pop(soundEnabled);
          }
        } catch {
          // ignore invalid
        }
      };
    }
  };

  const handleResetDemo = () => {
    setTodos(INITIAL_TODOS);
    setIsSettingsOpen(false);
    playSound.pop(soundEnabled);
  };

  // Categories list
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    todos.forEach((t) => {
      if (t.category) set.add(t.category);
    });
    return Array.from(set);
  }, [todos]);

  // Filtered and Sorted list
  const filteredTodos = useMemo(() => {
    return todos.filter((todo) => {
      // 1. Filter tab
      if (currentFilter === 'active' && todo.completed) return false;
      if (currentFilter === 'completed' && !todo.completed) return false;
      if (currentFilter === 'starred' && !todo.pinned) return false;

      // 2. Category filter
      if (selectedCategory !== 'all' && todo.category !== selectedCategory) return false;

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = todo.text.toLowerCase().includes(q);
        const matchesCategory = todo.category?.toLowerCase().includes(q);
        const matchesSubtask = todo.subtasks?.some((st) => st.text.toLowerCase().includes(q));
        if (!matchesTitle && !matchesCategory && !matchesSubtask) return false;
      }

      return true;
    }).sort((a, b) => {
      // Pinned items stay on top unless explicit custom sorting
      if (a.pinned !== b.pinned) {
        return a.pinned ? -1 : 1;
      }

      if (sortBy === 'date-newest') return b.createdAt - a.createdAt;
      if (sortBy === 'date-oldest') return a.createdAt - b.createdAt;
      if (sortBy === 'alphabetical') return a.text.localeCompare(b.text);
      if (sortBy === 'priority') {
        const weight = { high: 3, medium: 2, low: 1 };
        return weight[b.priority || 'medium'] - weight[a.priority || 'medium'];
      }

      // Default: active tasks first, then creation order
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      return b.createdAt - a.createdAt;
    });
  }, [todos, currentFilter, selectedCategory, searchQuery, sortBy]);

  // Computed counts
  const totalCount = todos.length;
  const activeCount = todos.filter((t) => !t.completed).length;
  const completedCount = totalCount - activeCount;
  const starredCount = todos.filter((t) => t.pinned).length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className={`min-h-screen flex items-center justify-center p-3 sm:p-6 transition-colors duration-500 bg-preset-${theme}`}>
      {/* Main App Container */}
      <main className="w-full max-w-xl md:max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-white/40 backdrop-blur-md">
        
        {/* Header Section */}
        <header className="bg-gray-50/90 p-5 sm:p-6 border-b border-gray-100 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800 tracking-tight flex items-center gap-2">
                <span>Tasks</span>
                {progressPercent === 100 && totalCount > 0 && (
                  <span className="text-emerald-500 text-sm font-semibold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full">
                    <Sparkles className="w-3.5 h-3.5" /> All Done!
                  </span>
                )}
              </h1>
              <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
                Manage your daily goals effectively.
              </p>
            </div>

            {/* Quick Actions & Preferences */}
            <div className="flex items-center gap-1.5">
              {activeCount > 0 && (
                <button
                  onClick={handleMarkAllComplete}
                  className="px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  title="Mark all tasks as done"
                >
                  <CheckCheck className="w-4 h-4 text-emerald-600" />
                  <span className="hidden sm:inline">Done All</span>
                </button>
              )}

              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-200/60 rounded-lg transition-colors cursor-pointer"
                title="Settings & Themes"
                aria-label="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          {totalCount > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs text-gray-500 tabular-nums">
                <span>Progress</span>
                <span className="font-semibold text-gray-700">
                  {completedCount} of {totalCount} completed ({progressPercent}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-orange-400 to-emerald-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Create Task Form */}
          <TaskInput onAdd={handleAddTodo} />

          {/* Search & Secondary Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1 text-xs">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks... (Press /)"
                className="w-full pl-8 pr-7 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-orange-400 text-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category filter dropdown & Sort dropdown */}
            <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
              {availableCategories.length > 0 && (
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-white border border-gray-200 text-gray-600 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-400 cursor-pointer"
                  title="Filter by category"
                >
                  <option value="all">All Tags</option>
                  {availableCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              )}

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortType)}
                className="bg-white border border-gray-200 text-gray-600 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-400 cursor-pointer"
                title="Sort tasks"
              >
                <option value="manual">Sort: Default</option>
                <option value="priority">Sort: High Priority</option>
                <option value="date-newest">Sort: Newest First</option>
                <option value="date-oldest">Sort: Oldest First</option>
                <option value="alphabetical">Sort: A-Z</option>
              </select>
            </div>
          </div>
        </header>

        {/* Read & Update & Delete: To-Do List Container */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 custom-scrollbar" id="todo-container">
          {filteredTodos.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center mb-3 text-orange-400">
                <SlidersHorizontal className="w-8 h-8 opacity-70" />
              </div>
              <p className="text-base font-semibold text-gray-600 mb-1">
                {searchQuery || selectedCategory !== 'all'
                  ? 'No matching tasks'
                  : currentFilter === 'completed'
                  ? 'No completed tasks yet'
                  : currentFilter === 'active'
                  ? 'All caught up! No active tasks'
                  : currentFilter === 'starred'
                  ? 'No starred tasks'
                  : 'No tasks found'}
              </p>
              <p className="text-xs text-gray-400 text-center max-w-xs">
                {searchQuery || selectedCategory !== 'all'
                  ? 'Try searching with different terms or reset your filters.'
                  : 'Add a new task above or get started on your priorities.'}
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              <AnimatePresence initial={false}>
                {filteredTodos.map((todo) => (
                  <TaskItem
                    key={todo.id}
                    todo={todo}
                    isEditing={editingId === todo.id}
                    onToggle={handleToggleTodo}
                    onDelete={handleDeleteTodo}
                    onStartEdit={handleStartEdit}
                    onSaveEdit={handleSaveEdit}
                    onCancelEdit={handleCancelEdit}
                    onToggleStar={handleToggleStar}
                    onToggleSubtask={handleToggleSubtask}
                    onAddSubtask={handleAddSubtask}
                    onDeleteSubtask={handleDeleteSubtask}
                    soundEnabled={soundEnabled}
                  />
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>

        {/* Undo Toast Banner */}
        <AnimatePresence>
          {recentlyDeleted && (
            <div className="bg-gray-900 text-white px-4 py-2.5 mx-3 mb-2 rounded-xl flex items-center justify-between shadow-lg text-xs animate-in slide-in-from-bottom-2 duration-150">
              <span className="truncate pr-2">
                Task removed: <strong className="font-medium">"{recentlyDeleted.item.text}"</strong>
              </span>
              <button
                onClick={handleUndoDelete}
                className="flex items-center gap-1 font-semibold text-orange-400 hover:text-orange-300 transition-colors shrink-0 cursor-pointer"
              >
                <Undo2 className="w-3.5 h-3.5" />
                Undo
              </button>
            </div>
          )}
        </AnimatePresence>

        {/* Footer / Advanced Filtering */}
        <footer className="bg-gray-50/90 border-t border-gray-100 p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <span className="tabular-nums font-medium text-gray-600">
            {activeCount} item{activeCount !== 1 ? 's' : ''} left
          </span>

          {/* Segmented Filter Buttons */}
          <div className="flex gap-1 bg-gray-200/70 p-1 rounded-xl">
            <button
              onClick={() => setCurrentFilter('all')}
              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                currentFilter === 'all'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              All ({totalCount})
            </button>
            <button
              onClick={() => setCurrentFilter('active')}
              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                currentFilter === 'active'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setCurrentFilter('completed')}
              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                currentFilter === 'completed'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Done ({completedCount})
            </button>
            {starredCount > 0 && (
              <button
                onClick={() => setCurrentFilter('starred')}
                className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  currentFilter === 'starred'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                ★ ({starredCount})
              </button>
            )}
          </div>

          {/* Clear Completed Action */}
          <button
            onClick={handleClearCompleted}
            disabled={completedCount === 0}
            className={`transition-all focus:outline-none cursor-pointer ${
              completedCount > 0
                ? 'text-gray-500 hover:text-red-500 hover:underline opacity-100'
                : 'opacity-0 pointer-events-none'
            }`}
          >
            Clear completed ({completedCount})
          </button>
        </footer>
      </main>

      {/* Preferences & Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        currentTheme={theme}
        onSelectTheme={(t) => setTheme(t)}
        onExport={handleExportJSON}
        onImport={handleImportJSON}
        onResetDemo={handleResetDemo}
      />
    </div>
  );
}
