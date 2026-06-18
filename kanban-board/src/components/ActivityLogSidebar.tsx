'use client';

import { useState, useEffect } from 'react';
import { useActivityLog } from '@/store/board-store';
import { relativeTime } from '@/utils/time';
import { getInitials } from '@/utils/constants';

export function ActivityLogSidebar() {
  const activityLog = useActivityLog();
  const [isOpen, setIsOpen] = useState(false);
  const [, setTick] = useState(0);

  // Update relative timestamps every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed right-0 top-1/2 -translate-y-1/2 z-30 bg-surface border border-r-0 border-outline-variant rounded-l-lg px-1.5 py-3 text-outline hover:text-primary transition-all cursor-pointer shadow-md ${
          isOpen ? 'right-80' : 'right-0'
        }`}
        title={isOpen ? 'Close activity log' : 'Open activity log'}
      >
        <span className="material-symbols-outlined text-[18px]">
          {isOpen ? 'chevron_right' : 'history'}
        </span>
      </button>

      {/* Sidebar Panel */}
      <aside
        className={`fixed right-0 top-16 bottom-0 w-80 bg-surface border-l border-outline-variant z-20 flex flex-col shadow-2xl transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <header className="p-lg border-b border-outline-variant flex justify-between items-center shrink-0">
          <h2 className="font-headline-sm text-sm font-bold flex items-center gap-sm text-on-surface">
            <span className="material-symbols-outlined text-primary text-[20px]">history</span>
            Activity Feed
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-hover rounded-md text-outline cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </header>

        {/* Scrollable Feed */}
        <div className="flex-1 overflow-y-auto p-lg flex flex-col gap-lg custom-scrollbar">
          {activityLog.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-md text-center text-xs text-outline opacity-60 mt-10">
              <span className="material-symbols-outlined text-[32px] mb-sm text-outline-variant">history_toggle_off</span>
              <p>No activity logged yet</p>
            </div>
          ) : (
            <div className="flex flex-col gap-lg">
              {activityLog.map((entry, index) => {
                const isLast = index === activityLog.length - 1;
                return (
                  <div key={entry.id} className={`relative flex gap-md ${!isLast ? 'activity-feed-line' : ''}`}>
                    {/* Left Icon/Initials Avatar */}
                    <div className="relative z-10 shrink-0">
                      <div className="w-6 h-6 rounded-full bg-primary-container text-on-primary-container text-[9px] font-extrabold flex items-center justify-center border border-outline-variant shadow-sm" title={entry.tabLabel}>
                        {getInitials(entry.tabLabel)}
                      </div>
                    </div>

                    {/* Right Content */}
                    <div className="flex flex-col gap-1 min-w-0">
                      <p className="text-xs text-on-surface leading-normal">
                        <span className="font-bold text-on-surface">{entry.tabLabel}</span>{' '}
                        <span className="text-on-surface-variant">{entry.description}</span>
                      </p>
                      <span className="text-[10px] text-outline font-semibold">
                        {relativeTime(entry.timestamp)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="p-lg border-t border-outline-variant bg-surface-container-low shrink-0">
          <div className="text-center text-[10px] text-outline font-bold uppercase tracking-wider">
            Total {activityLog.length} Event{activityLog.length === 1 ? '' : 's'}
          </div>
        </footer>
      </aside>
    </>
  );
}
