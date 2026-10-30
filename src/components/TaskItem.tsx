import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Check, 
  X, 
  Pencil, 
  Trash2, 
  Star, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  AlertCircle 
} from 'lucide-react';
import { TodoItem, PriorityLevel } from '../types/todo';

interface TaskItemProps {
  todo: TodoItem;
  isEditing: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onStartEdit: (id: string) => void;
  onSaveEdit: (id: string, newText: string, priority?: PriorityLevel, category?: string, dueDate?: string) => void;
  onCancelEdit: () => void;
  onToggleStar: (id: string) => void;
  onToggleSubtask: (todoId: string, subtaskId: string) => void;
  onAddSubtask: (todoId: string, text: string) => void;
  onDeleteSubtask: (todoId: string, subtaskId: string) => void;
  soundEnabled: boolean;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  todo,
  isEditing,
  onToggle,
  onDelete,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onToggleStar,
  onToggleSubtask,
  onAddSubtask,
  onDeleteSubtask,
}) => {
  const [editText, setEditText] = useState(todo.text);
  const [editPriority, setEditPriority] = useState<PriorityLevel>(todo.priority);
  const [editCategory, setEditCategory] = useState(todo.category || 'General');
  const [editDueDate, setEditDueDate] = useState(todo.dueDate || '');
  const [isExpanded, setIsExpanded] = useState(false);
  const [newSubtaskText, setNewSubtaskText] = useState('');

  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      setEditText(todo.text);
      setEditPriority(todo.priority);
      setEditCategory(todo.category || 'General');
      setEditDueDate(todo.dueDate || '');
      setTimeout(() => {
        if (editInputRef.current) {
          editInputRef.current.focus();
          editInputRef.current.select();
        }
      }, 30);
    }
  }, [isEditing, todo]);

  const handleSave = () => {
    if (editText.trim()) {
      onSaveEdit(todo.id, editText.trim(), editPriority, editCategory, editDueDate);
    } else {
      onCancelEdit();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancelEdit();
    }
  };

  const handleAddSubtaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubtaskText.trim()) {
      onAddSubtask(todo.id, newSubtaskText.trim());
      setNewSubtaskText('');
    }
  };

  // Helper for due date display
  const getDueDateDisplay = (dueDateStr?: string) => {
    if (!dueDateStr) return null;
    const today = new Date().toISOString().split('T')[0];
    const target = dueDateStr;

    const isToday = target === today;
    const isOverdue = target < today && !todo.completed;

    let label = target;
    try {
      const parts = target.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      }
    } catch {
      label = target;
    }

    if (isOverdue) {
      return (
        <span className="flex items-center gap-1 text-[11px] font-medium text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span>Overdue · {label}</span>
        </span>
      );
    }

    if (isToday) {
      return (
        <span className="flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
          <Calendar className="w-3 h-3 shrink-0" />
          <span>Today</span>
        </span>
      );
    }

    return (
      <span className="flex items-center gap-1 text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
        <Calendar className="w-3 h-3 shrink-0" />
        <span>{label}</span>
      </span>
    );
  };

  const priorityColor = {
    high: 'text-rose-600 font-semibold',
    medium: 'text-amber-600 font-medium',
    low: 'text-gray-400'
  }[todo.priority || 'medium'];

  const subtasks = todo.subtasks || [];
  const completedSubtasksCount = subtasks.filter((s) => s.completed).length;

  if (isEditing) {
    return (
      <motion.li
        layout
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        className="p-3.5 bg-orange-50/60 rounded-xl border border-orange-300 shadow-sm transition-all"
      >
        <div className="flex items-center gap-2 mb-2.5">
          <input
            ref={editInputRef}
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 px-3 py-2 text-sm bg-white rounded-lg border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-400 font-medium text-gray-800 shadow-inner"
            placeholder="Edit task description..."
          />
          <button
            onClick={handleSave}
            className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100/80 rounded-lg transition-colors cursor-pointer"
            title="Save changes (Enter)"
            aria-label="Save"
          >
            <Check className="w-5 h-5 stroke-[2.5]" />
          </button>
          <button
            onClick={onCancelEdit}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200/80 rounded-lg transition-colors cursor-pointer"
            title="Cancel (Esc)"
            aria-label="Cancel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick parameters in edit mode */}
        <div className="flex flex-wrap items-center gap-2 text-xs pt-1 border-t border-orange-100">
          <span className="text-gray-500 font-medium">Priority:</span>
          <div className="flex items-center gap-1">
            {(['low', 'medium', 'high'] as PriorityLevel[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setEditPriority(p)}
                className={`px-2 py-0.5 rounded capitalize transition-all cursor-pointer ${
                  editPriority === p
                    ? p === 'high'
                      ? 'bg-rose-500 text-white font-medium shadow-xs'
                      : p === 'medium'
                      ? 'bg-amber-500 text-white font-medium shadow-xs'
                      : 'bg-gray-600 text-white font-medium shadow-xs'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <span className="text-gray-300 mx-1">|</span>

          <span className="text-gray-500 font-medium">Due:</span>
          <input
            type="date"
            value={editDueDate}
            onChange={(e) => setEditDueDate(e.target.value)}
            className="px-2 py-0.5 text-xs bg-white border border-gray-200 rounded text-gray-700 focus:outline-none focus:ring-1 focus:ring-orange-400"
          />

          <span className="text-gray-300 mx-1">|</span>

          <span className="text-gray-500 font-medium">Tag:</span>
          <input
            type="text"
            value={editCategory}
            onChange={(e) => setEditCategory(e.target.value)}
            placeholder="e.g. Work, Home"
            className="px-2 py-0.5 text-xs w-24 bg-white border border-gray-200 rounded text-gray-700 focus:outline-none focus:ring-1 focus:ring-orange-400"
          />
        </div>
      </motion.li>
    );
  }

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.18 }}
      className={`group rounded-xl border transition-all duration-200 shadow-xs hover:shadow-md ${
        todo.completed
          ? 'bg-gray-50/80 border-gray-200/70'
          : todo.pinned
          ? 'bg-amber-50/40 border-amber-200'
          : 'bg-white hover:bg-orange-50/30 border-gray-200/80 hover:border-orange-200'
      }`}
    >
      <div className="flex items-center justify-between p-3.5 gap-3">
        {/* Left: Star & Custom Checkbox & Content */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Star / Pin button */}
          <button
            onClick={() => onToggleStar(todo.id)}
            className={`p-1 rounded-md transition-colors cursor-pointer shrink-0 ${
              todo.pinned
                ? 'text-amber-500 hover:text-amber-600'
                : 'text-gray-300 hover:text-amber-400 opacity-60 group-hover:opacity-100'
            }`}
            title={todo.pinned ? 'Unstar task' : 'Star & pin to top'}
            aria-label="Star task"
          >
            <Star className={`w-4 h-4 ${todo.pinned ? 'fill-amber-400 text-amber-500' : ''}`} />
          </button>

          {/* Custom Checkbox from user prompt */}
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => onToggle(todo.id)}
            className="custom-checkbox shrink-0"
            aria-label="Toggle task completion"
          />

          {/* Main Title & Metadata */}
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                onClick={() => onToggle(todo.id)}
                className={`cursor-pointer select-none text-[15px] transition-all duration-200 break-words ${
                  todo.completed
                    ? 'text-gray-400 line-through'
                    : 'text-gray-800 font-medium hover:text-orange-950'
                }`}
              >
                {todo.text}
              </span>
            </div>

            {/* Clean inline unboxed metadata */}
            <div className="flex items-center gap-2 mt-1 flex-wrap text-xs">
              {/* Category */}
              {todo.category && (
                <span className="text-gray-400 font-normal">
                  {todo.category}
                </span>
              )}

              {/* Priority indicator */}
              {todo.priority && todo.priority !== 'low' && (
                <>
                  <span className="text-gray-300" aria-hidden="true">·</span>
                  <span className={`text-[11px] capitalize ${priorityColor}`}>
                    {todo.priority}
                  </span>
                </>
              )}

              {/* Due Date badge */}
              {todo.dueDate && (
                <>
                  <span className="text-gray-300" aria-hidden="true">·</span>
                  {getDueDateDisplay(todo.dueDate)}
                </>
              )}

              {/* Subtask progress */}
              {subtasks.length > 0 && (
                <>
                  <span className="text-gray-300" aria-hidden="true">·</span>
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-[11px] text-gray-500 hover:text-orange-600 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>
                      {completedSubtasksCount}/{subtasks.length} steps
                    </span>
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions (Edit, Expand subtasks/notes, Delete) */}
        <div className="flex items-center gap-0.5 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100 shrink-0">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            title={isExpanded ? 'Collapse details' : 'Subtasks & Notes'}
            aria-label="Toggle details"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <button
            onClick={() => onStartEdit(todo.id)}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400"
            title="Edit task"
            aria-label="Edit"
          >
            <Pencil className="w-4 h-4" />
          </button>

          <button
            onClick={() => onDelete(todo.id)}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-400"
            title="Delete task"
            aria-label="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expandable Subtasks & Notes drawer */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pb-3.5 pt-1 border-t border-gray-100 bg-gray-50/50 rounded-b-xl"
          >
            {/* Subtask checklist */}
            <div className="space-y-1.5 mb-2.5 mt-1">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                Subtasks / Steps ({completedSubtasksCount}/{subtasks.length})
              </span>

              {subtasks.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No subtasks yet. Add one below:</p>
              ) : (
                subtasks.map((st) => (
                  <div key={st.id} className="flex items-center justify-between gap-2 text-xs py-1 px-2 rounded-md bg-white border border-gray-100 hover:border-gray-200">
                    <label className="flex items-center gap-2 flex-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={st.completed}
                        onChange={() => onToggleSubtask(todo.id, st.id)}
                        className="rounded border-gray-300 text-orange-500 focus:ring-orange-400 w-3.5 h-3.5 cursor-pointer"
                      />
                      <span className={`select-none ${st.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                        {st.text}
                      </span>
                    </label>
                    <button
                      onClick={() => onDeleteSubtask(todo.id, st.id)}
                      className="text-gray-300 hover:text-red-500 p-0.5 transition-colors cursor-pointer"
                      title="Remove subtask"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}

              {/* Add subtask input */}
              <form onSubmit={handleAddSubtaskSubmit} className="flex items-center gap-1.5 mt-2">
                <input
                  type="text"
                  placeholder="Add a step..."
                  value={newSubtaskText}
                  onChange={(e) => setNewSubtaskText(e.target.value)}
                  className="flex-1 px-2.5 py-1 text-xs bg-white rounded border border-gray-200 focus:outline-none focus:ring-1 focus:ring-orange-400"
                />
                <button
                  type="submit"
                  disabled={!newSubtaskText.trim()}
                  className="px-2.5 py-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white rounded text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add</span>
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
};
