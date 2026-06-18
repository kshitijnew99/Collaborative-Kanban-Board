'use client';

import { useBroadcastSync } from '@/hooks/use-broadcast-sync';
import { useTabRegistry } from '@/hooks/use-tab-registry';
import { TopBar } from '@/components/TopBar';
import { Board } from '@/components/Board';
import { ActivityLogSidebar } from '@/components/ActivityLogSidebar';

export function KanbanApp() {
  // Wire up BroadcastChannel sync and tab registry at the root
  useBroadcastSync();
  useTabRegistry();

  return (
    <div className="flex flex-col h-screen bg-background text-on-surface overflow-hidden">
      {/* Top Navbar */}
      <TopBar />

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Side Navigation Bar */}
        <aside className="hidden md:flex flex-col h-[calc(100vh-64px)] w-64 bg-surface border-r border-outline-variant p-md gap-sm shrink-0">
          <div className="flex items-center gap-sm mb-lg px-xs py-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary">
              <span className="material-symbols-outlined text-[20px]">terminal</span>
            </div>
            <div>
              <h2 className="font-headline-sm text-sm font-bold text-on-surface leading-tight">Engineering</h2>
              <p className="text-[10px] text-on-surface-variant leading-none">Product Team</p>
            </div>
          </div>

          <nav className="flex-grow flex flex-col gap-xs">
            <a className="flex items-center gap-md px-md py-sm bg-selected text-primary font-semibold rounded-lg hover:bg-hover transition-colors" href="#">
              <span className="material-symbols-outlined text-[20px]">assignment</span>
              <span className="text-xs">Issues</span>
            </a>
            <a className="flex items-center gap-md px-md py-sm text-on-surface-variant rounded-lg hover:bg-hover transition-colors" href="#">
              <span className="material-symbols-outlined text-[20px]">sync</span>
              <span className="text-xs">Cycles</span>
            </a>
            <a className="flex items-center gap-md px-md py-sm text-on-surface-variant rounded-lg hover:bg-hover transition-colors" href="#">
              <span className="material-symbols-outlined text-[20px]">map</span>
              <span className="text-xs">Roadmaps</span>
            </a>
            <a className="flex items-center gap-md px-md py-sm text-on-surface-variant rounded-lg hover:bg-hover transition-colors" href="#">
              <span className="material-symbols-outlined text-[20px]">groups</span>
              <span className="text-xs">Team</span>
            </a>
            <a className="flex items-center gap-md px-md py-sm text-on-surface-variant rounded-lg hover:bg-hover transition-colors" href="#">
              <span className="material-symbols-outlined text-[20px]">settings</span>
              <span className="text-xs">Settings</span>
            </a>
          </nav>

          <div className="mt-auto border-t border-outline-variant pt-md flex flex-col gap-xs">
            <a className="flex items-center gap-md px-md py-sm text-on-surface-variant rounded-lg hover:bg-hover transition-colors" href="#">
              <span className="material-symbols-outlined text-[20px]">menu_book</span>
              <span className="text-xs">Docs</span>
            </a>
            <a className="flex items-center gap-md px-md py-sm text-on-surface-variant rounded-lg hover:bg-hover transition-colors" href="#">
              <span className="material-symbols-outlined text-[20px]">campaign</span>
              <span className="text-xs">Feedback</span>
            </a>
          </div>
        </aside>

        {/* Content Viewport */}
        <main className="flex-1 flex min-w-0 bg-background overflow-hidden relative">
          <Board />
          <ActivityLogSidebar />
        </main>
      </div>
    </div>
  );
}
