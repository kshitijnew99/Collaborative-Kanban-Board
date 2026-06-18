'use client';

import { useState, useRef, useEffect } from 'react';
import { useBoardStore, useTabCount } from '@/store/board-store';
import type { Priority } from '@/types';
import { generateId } from '@/utils/id';

const PRIORITY_OPTIONS: Array<{ value: Priority | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

export function TopBar() {
  const boardTitle = useBoardStore((s) => s.board.title);
  const setBoardTitle = useBoardStore((s) => s.setBoardTitle);
  const appendActivityLog = useBoardStore((s) => s.appendActivityLog);
  const tabId = useBoardStore((s) => s.tabId);
  const tabLabel = useBoardStore((s) => s.tabLabel);
  const searchQuery = useBoardStore((s) => s.searchQuery);
  const setSearchQuery = useBoardStore((s) => s.setSearchQuery);
  const priorityFilter = useBoardStore((s) => s.priorityFilter);
  const setPriorityFilter = useBoardStore((s) => s.setPriorityFilter);
  const tabCount = useTabCount();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(boardTitle);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitleDraft(boardTitle);
  }, [boardTitle]);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  const commitTitle = () => {
    const trimmed = titleDraft.trim();
    if (trimmed && trimmed !== boardTitle) {
      setBoardTitle(trimmed, 'local');
      appendActivityLog(
        {
          id: generateId(),
          description: `Board renamed to "${trimmed}"`,
          timestamp: Date.now(),
          tabId,
          tabLabel,
        },
        'local'
      );
    } else {
      setTitleDraft(boardTitle);
    }
    setIsEditingTitle(false);
  };

  return (
    <header className="bg-surface border-b border-outline-variant flex justify-between items-center w-full px-lg h-16 z-50 sticky top-0 shrink-0">
      {/* Board Title / Project Pulse Logo */}
      <div className="flex items-center gap-xl min-w-0">
        <div className="flex items-center gap-2">
          {isEditingTitle ? (
            <input
              ref={titleInputRef}
              type="text"
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitTitle();
                if (e.key === 'Escape') {
                  setTitleDraft(boardTitle);
                  setIsEditingTitle(false);
                }
              }}
              className="bg-background text-on-surface text-lg font-bold px-2 py-0.5 rounded-lg border border-primary outline-none w-48"
            />
          ) : (
            <h1
              onClick={() => setIsEditingTitle(true)}
              className="font-headline-sm text-headline-sm font-bold text-on-surface cursor-pointer hover:text-primary transition-colors truncate"
              title="Click to edit board title"
            >
              {boardTitle}
            </h1>
          )}
        </div>
      </div>

      {/* Middle Spacer */}
      <div className="flex-grow" />

      {/* Actions Section */}
      <div className="flex items-center gap-lg">
        {/* Search Input */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search issues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-1.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none text-sm w-64 transition-all"
          />
        </div>

        {/* Priority Filter Segmented Control */}
        <div className="flex bg-surface-container p-0.5 rounded-lg border border-outline-variant">
          {PRIORITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPriorityFilter(opt.value)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                priorityFilter === opt.value
                  ? 'bg-surface shadow-sm text-primary font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Tab / Collaboration Counter */}
        <div
          className="flex items-center gap-1.5 text-sm text-on-surface-variant border-l border-outline-variant pl-md ml-xs"
          title={`${tabCount} tab${tabCount === 1 ? '' : 's'} open`}
        >
          <span className="material-symbols-outlined text-[20px] text-primary">
            groups
          </span>
          <span className="font-semibold tabular-nums text-on-surface">
            {tabCount}
          </span>
        </div>
      </div>
    </header>
  );
}
