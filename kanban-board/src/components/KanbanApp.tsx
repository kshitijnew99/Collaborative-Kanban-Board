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
    <div className="flex flex-col h-screen bg-[#010102] overflow-hidden">
      <TopBar />
      <Board />
      <ActivityLogSidebar />
    </div>
  );
}
