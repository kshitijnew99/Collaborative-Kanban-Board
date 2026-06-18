import type { Board } from '@/types';
import { generateId } from '@/utils/id';

// ─── Channel & Storage Keys ───────────────────────────────────────────
export const BROADCAST_CHANNEL_NAME = 'kanban-board';
export const LOCALSTORAGE_BOARD_KEY = 'kanban-board-state';
export const LOCALSTORAGE_ACTIVITY_KEY = 'kanban-board-activity';

// ─── Timing ────────────────────────────────────────────────────────────
export const DEBOUNCE_MS = 250;
export const HEARTBEAT_INTERVAL_MS = 5000;
export const HEARTBEAT_TIMEOUT_MS = 15000;

// ─── Limits ────────────────────────────────────────────────────────────
export const MAX_ACTIVITY_LOG = 20;

// ─── Assignees ─────────────────────────────────────────────────────────
export const DEFAULT_ASSIGNEES = [
  'Alice Johnson',
  'Bob Smith',
  'Carol Williams',
  'David Brown',
  'Eve Davis',
] as const;

export type Assignee = (typeof DEFAULT_ASSIGNEES)[number];

// ─── Default Board ─────────────────────────────────────────────────────
export function createDefaultBoard(): Board {
  return {
    title: 'Linear Kanban System',
    columns: [
      { id: generateId(), name: 'Backlog', cardIds: [] },
      { id: generateId(), name: 'Todo', cardIds: [] },
      { id: generateId(), name: 'In Progress', cardIds: [] },
      { id: generateId(), name: 'Done', cardIds: [] },
    ],
    cardsById: {},
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
