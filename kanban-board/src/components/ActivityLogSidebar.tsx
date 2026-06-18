'use client';

import { useState, useEffect } from 'react';
import { useActivityLog } from '@/store/board-store';
import { relativeTime } from '@/utils/time';

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
        className={`fixed right-0 top-1/2 -translate-y-1/2 z-20 bg-[#0f1011] border border-r-0 border-[#23252a] rounded-l-lg px-1.5 py-3 text-[#8a8f98] hover:text-[#f7f8f8] transition-colors cursor-pointer ${
          isOpen ? 'right-72' : 'right-0'
        }`}
        title={isOpen ? 'Close activity log' : 'Open activity log'}
      >
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Sidebar */}
      <div
        className={`fixed right-0 top-0 bottom-0 w-72 bg-[#0f1011] border-l border-[#23252a] z-10 flex flex-col transition-transform duration-200 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#23252a]">
          <h2 className="text-sm font-semibold text-[#d0d6e0]">Activity Log</h2>
          <span className="text-xs text-[#62666d]">{activityLog.length} events</span>
        </div>

        <div className="flex-1 overflow-y-auto">
          {activityLog.length === 0 ? (
            <div className="p-4 text-center text-xs text-[#62666d]">
              No activity yet
            </div>
          ) : (
            <div className="divide-y divide-[#23252a]">
              {activityLog.map((entry) => (
                <div key={entry.id} className="px-4 py-3">
                  <p className="text-xs text-[#d0d6e0] leading-relaxed mb-1">
                    {entry.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#62666d]">
                      {relativeTime(entry.timestamp)}
                    </span>
                    <span className="text-[10px] text-[#5e6ad2] font-medium">
                      {entry.tabLabel}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
