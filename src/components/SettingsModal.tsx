import React, { useRef } from 'react';
import { X, Volume2, VolumeX, Download, Upload, Palette, Keyboard, RotateCcw } from 'lucide-react';
import { ThemePreset } from '../types/todo';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  currentTheme: ThemePreset;
  onSelectTheme: (theme: ThemePreset) => void;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onResetDemo: () => void;
}

const THEMES: { id: ThemePreset; name: string; gradient: string }[] = [
  { id: 'sunset', name: 'Warm Sunset', gradient: 'from-[#f6d365] to-[#fda085]' },
  { id: 'ocean', name: 'Ocean Breeze', gradient: 'from-[#a1c4fd] to-[#c2e9fb]' },
  { id: 'aurora', name: 'Aurora Emerald', gradient: 'from-[#84fab0] to-[#8fd3f4]' },
  { id: 'lavender', name: 'Lavender Mist', gradient: 'from-[#e0c3fc] to-[#8ec5fc]' },
  { id: 'slate', name: 'Midnight Slate', gradient: 'from-[#334155] to-[#0f172a]' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  soundEnabled,
  onToggleSound,
  currentTheme,
  onSelectTheme,
  onExport,
  onImport,
  onResetDemo,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/70">
          <h2 className="text-lg font-bold text-gray-800">Preferences & Tools</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200/70 rounded-lg transition-colors cursor-pointer"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* Theme Preset */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-3">
              <Palette className="w-4 h-4 text-orange-500" />
              Background Theme
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => onSelectTheme(theme.id)}
                  className={`flex items-center gap-2.5 p-2 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                    currentTheme === theme.id
                      ? 'border-orange-500 ring-2 ring-orange-400/30 font-semibold text-gray-900 bg-orange-50/30'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600 bg-white'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full shrink-0 shadow-xs bg-gradient-to-br ${theme.gradient}`}
                  />
                  <span className="truncate">{theme.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sound Feedback */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <VolumeX className="w-4 h-4 text-gray-400" />
                )}
                Sound Feedback
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Play subtle tactile audio chime on completing tasks
              </p>
            </div>
            <button
              onClick={onToggleSound}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                soundEnabled ? 'bg-orange-500' : 'bg-gray-300'
              }`}
              role="switch"
              aria-checked={soundEnabled}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  soundEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Backup & Data */}
          <div className="pt-4 border-t border-gray-100 space-y-3">
            <label className="text-sm font-semibold text-gray-800 block">
              Data & Backup
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onExport}
                className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-gray-500" />
                Export Tasks JSON
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4 text-gray-500" />
                Import JSON
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={onImport}
                className="hidden"
              />
            </div>

            <button
              onClick={onResetDemo}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100/80 border border-amber-200/80 rounded-xl transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-amber-600" />
              Restore Starter Sample Tasks
            </button>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-2">
              <Keyboard className="w-3.5 h-3.5 text-gray-400" />
              Keyboard Shortcuts
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500">
              <div className="flex justify-between">
                <span>Add task</span>
                <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-[10px] font-mono">Enter</kbd>
              </div>
              <div className="flex justify-between">
                <span>Save edit</span>
                <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-[10px] font-mono">Enter</kbd>
              </div>
              <div className="flex justify-between">
                <span>Cancel edit</span>
                <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-[10px] font-mono">Esc</kbd>
              </div>
              <div className="flex justify-between">
                <span>Quick search</span>
                <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-[10px] font-mono">/</kbd>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
