import type { Board, ActivityLogEntry } from '@/types';
import {
  LOCALSTORAGE_BOARD_KEY,
  LOCALSTORAGE_ACTIVITY_KEY,
  DEBOUNCE_MS,
  createDefaultBoard,
} from '@/utils/constants';

// ─── Load ──────────────────────────────────────────────────────────────

export function loadBoard(): Board {
  if (typeof window === 'undefined') return createDefaultBoard();

  try {
    const raw = localStorage.getItem(LOCALSTORAGE_BOARD_KEY);
    if (raw) {
      return JSON.parse(raw) as Board;
    }
  } catch {
    // Corrupted data — fall back to default
  }
  return createDefaultBoard();
}

export function loadActivityLog(): ActivityLogEntry[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(LOCALSTORAGE_ACTIVITY_KEY);
    if (raw) {
      return JSON.parse(raw) as ActivityLogEntry[];
    }
  } catch {
    // Corrupted data — fall back to empty
  }
  return [];
}

// ─── Save ──────────────────────────────────────────────────────────────

function saveBoard(board: Board): void {
  try {
    localStorage.setItem(LOCALSTORAGE_BOARD_KEY, JSON.stringify(board));
  } catch {
    // Storage full or unavailable — silently fail
  }
}

function saveActivityLog(log: ActivityLogEntry[]): void {
  try {
    localStorage.setItem(LOCALSTORAGE_ACTIVITY_KEY, JSON.stringify(log));
  } catch {
    // Storage full or unavailable — silently fail
  }
}

// ─── Debounced Writers ─────────────────────────────────────────────────

function createDebouncedWriter<T>(
  writeFn: (data: T) => void,
  delayMs: number
): (data: T) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;

  return (data: T) => {
    if (timer !== null) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      writeFn(data);
      timer = null;
    }, delayMs);
  };
}

export const debouncedSaveBoard = createDebouncedWriter(saveBoard, DEBOUNCE_MS);
export const debouncedSaveActivityLog = createDebouncedWriter(
  saveActivityLog,
  DEBOUNCE_MS
);
