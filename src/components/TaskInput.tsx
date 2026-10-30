import React, { useState, useRef } from 'react';
import { Plus, Calendar, Flag, Tag, SlidersHorizontal, ChevronUp } from 'lucide-react';
import { PriorityLevel } from '../types/todo';

interface TaskInputProps {
  onAdd: (text: string, priority: PriorityLevel, category: string, dueDate: string) => void;
}

const CATEGORIES = ['General', 'Work', 'Personal', 'Health', 'Shopping', 'Learning'];

export const TaskInput: React.FC<TaskInputProps> = ({ onAdd }) => {
  const [text, setText] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('medium');
  const [category, setCategory] = useState('General');
  const [dueDate, setDueDate] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    onAdd(text.trim(), priority, category, dueDate);
    setText('');
    setDueDate('');
    // keep category/priority or reset as needed
    inputRef.current?.focus();
  };

  const setDueToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setDueDate(today);
  };

  const setDueTomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    setDueDate(d.toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-2">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            id="new-todo-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What needs to be done?"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all shadow-xs pr-10 text-[15px]"
            autoComplete="off"
            required
          />

          {/* Quick toggle options button */}
          <button
            type="button"
            onClick={() => setShowOptions(!showOptions)}
            className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-colors cursor-pointer ${
              showOptions || priority !== 'medium' || dueDate || category !== 'General'
                ? 'text-orange-600 bg-orange-50'
                : ''
            }`}
            title="Task details & options"
            aria-label="Toggle options"
          >
            {showOptions ? <ChevronUp className="w-4 h-4" /> : <SlidersHorizontal className="w-4 h-4" />}
          </button>
        </div>

        <button
          type="submit"
          className="bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>Add</span>
        </button>
      </form>

      {/* Expandable Options Tray */}
      {showOptions && (
        <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-200/70 text-xs text-gray-600 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex flex-wrap items-center gap-4">
            {/* Priority Picker */}
            <div className="flex items-center gap-1.5">
              <span className="flex items-center gap-1 font-medium text-gray-500">
                <Flag className="w-3.5 h-3.5 text-gray-400" />
                Priority:
              </span>
              <div className="flex items-center bg-white rounded-lg border border-gray-200 p-0.5">
                {(['low', 'medium', 'high'] as PriorityLevel[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`px-2 py-0.5 rounded capitalize transition-all cursor-pointer ${
                      priority === p
                        ? p === 'high'
                          ? 'bg-rose-500 text-white font-medium shadow-xs'
                          : p === 'medium'
                          ? 'bg-amber-500 text-white font-medium shadow-xs'
                          : 'bg-gray-600 text-white font-medium shadow-xs'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Category / Project */}
            <div className="flex items-center gap-1.5">
              <span className="flex items-center gap-1 font-medium text-gray-500">
                <Tag className="w-3.5 h-3.5 text-gray-400" />
                Category:
              </span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-white border border-gray-200 text-gray-700 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-orange-400 cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Due Date Shortcut */}
            <div className="flex items-center gap-1.5">
              <span className="flex items-center gap-1 font-medium text-gray-500">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                Due:
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={setDueToday}
                  className={`px-2 py-1 rounded border transition-colors cursor-pointer ${
                    dueDate === new Date().toISOString().split('T')[0]
                      ? 'bg-orange-50 border-orange-300 text-orange-700 font-medium'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={setDueTomorrow}
                  className="px-2 py-1 rounded bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Tomorrow
                </button>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="bg-white border border-gray-200 rounded px-1.5 py-0.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-orange-400"
                />
                {dueDate && (
                  <button
                    type="button"
                    onClick={() => setDueDate('')}
                    className="text-gray-400 hover:text-gray-600 px-1 py-0.5 text-xs"
                    title="Clear date"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
