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
    <header className="flex items-center gap-4 px-5 py-3 bg-[#0f1011] border-b border-[#23252a] shrink-0">
      {/* Board Title */}
      <div className="flex items-center gap-2 min-w-0">
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
            className="bg-[#141516] text-[#f7f8f8] text-lg font-semibold px-2 py-1 rounded-lg border border-[#5e6ad2] outline-none w-48"
          />
        ) : (
          <h1
            onClick={() => setIsEditingTitle(true)}
            className="text-[#f7f8f8] text-lg font-semibold cursor-pointer hover:text-[#828fff] transition-colors truncate"
            title="Click to edit board title"
          >
            {boardTitle}
          </h1>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#62666d]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search cards..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-[#141516] text-[#f7f8f8] text-sm pl-8 pr-3 py-1.5 rounded-lg border border-[#23252a] focus:border-[#5e6ad2] outline-none w-48 placeholder:text-[#62666d] transition-colors"
        />
      </div>

      {/* Priority Filter */}
      <div className="flex items-center gap-1 bg-[#141516] rounded-lg p-0.5 border border-[#23252a]">
        {PRIORITY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setPriorityFilter(opt.value)}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              priorityFilter === opt.value
                ? 'bg-[#5e6ad2] text-white'
                : 'text-[#8a8f98] hover:text-[#f7f8f8]'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Tab Count */}
      <div className="flex items-center gap-1.5 text-sm text-[#8a8f98]" title={`${tabCount} tab${tabCount === 1 ? '' : 's'} open`}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <span className="font-medium tabular-nums">{tabCount}</span>
      </div>
    </header>
  );
}
