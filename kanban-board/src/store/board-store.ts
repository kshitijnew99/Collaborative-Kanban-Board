import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import type {
  Board,
  KanbanCard,
  Priority,
  ActivityLogEntry,
  TabRegistryEntry,
  ActionOrigin,
  Comment,
} from '@/types';
import { postMessage } from '@/broadcast/channel';
import { loadBoard, loadActivityLog, debouncedSaveBoard, debouncedSaveActivityLog } from '@/persistence/storage';
import { generateId, getTabId } from '@/utils/id';
import { MAX_ACTIVITY_LOG } from '@/utils/constants';

// ─── Store State ───────────────────────────────────────────────────────

interface BoardState {
  board: Board;
  activityLog: ActivityLogEntry[];
  selectedCardId: string | null;
  draggingCardId: string | null;
  searchQuery: string;
  priorityFilter: Priority | 'all';
  tabRegistry: TabRegistryEntry[];
  tabId: string;
  tabLabel: string;
}

// ─── Store Actions ─────────────────────────────────────────────────────

interface BoardActions {
  // Board mutations (origin-tagged → broadcast on 'local')
  createCard: (columnId: string, title: string, origin: ActionOrigin) => void;
  editCard: (cardId: string, updates: Partial<Omit<KanbanCard, 'id' | 'createdAt'>>, origin: ActionOrigin) => void;
  deleteCard: (cardId: string, origin: ActionOrigin) => void;
  moveCard: (cardId: string, fromColumnId: string, toColumnId: string, toIndex: number, origin: ActionOrigin) => void;
  renameColumn: (columnId: string, newName: string, origin: ActionOrigin) => void;
  setBoardTitle: (title: string, origin: ActionOrigin) => void;
  addComment: (cardId: string, comment: Comment, origin: ActionOrigin) => void;
  appendActivityLog: (entry: ActivityLogEntry, origin: ActionOrigin) => void;

  // UI-only actions (no broadcast)
  setSelectedCardId: (id: string | null) => void;
  setDraggingCardId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setPriorityFilter: (filter: Priority | 'all') => void;
  setTabRegistry: (entries: TabRegistryEntry[]) => void;
  setTabLabel: (label: string) => void;

  // Full board replacement (for remote full-sync if needed)
  replaceBoard: (board: Board) => void;
}

export type BoardStore = BoardState & BoardActions;

// ─── Store ─────────────────────────────────────────────────────────────

export const useBoardStore = create<BoardStore>((set, get) => {
  // Hydrate from localStorage on creation
  const initialBoard = typeof window !== 'undefined' ? loadBoard() : loadBoard();
  const initialLog = typeof window !== 'undefined' ? loadActivityLog() : [];
  const tabId = typeof window !== 'undefined' ? getTabId() : 'server';

  return {
    // ── Initial State ────────────────────────────────────────────────
    board: initialBoard,
    activityLog: initialLog,
    selectedCardId: null,
    draggingCardId: null,
    searchQuery: '',
    priorityFilter: 'all',
    tabRegistry: [],
    tabId,
    tabLabel: 'Tab 1',

    // ── Board Mutations ──────────────────────────────────────────────

    createCard: (columnId, title, origin) => {
      const card: KanbanCard = {
        id: generateId(),
        title,
        description: '',
        priority: 'medium',
        dueDate: null,
        assignee: null,
        color: null,
        labels: [],
        metadata: {},
        comments: [],
        createdAt: Date.now(),
      };

      set((state) => {
        const newCardsById = { ...state.board.cardsById, [card.id]: card };
        const newColumns = state.board.columns.map((col) =>
          col.id === columnId
            ? { ...col, cardIds: [...col.cardIds, card.id] }
            : col
        );
        const newBoard = { ...state.board, columns: newColumns, cardsById: newCardsById };
        debouncedSaveBoard(newBoard);
        return { board: newBoard };
      });

      if (origin === 'local') {
        postMessage({
          type: 'CARD_CREATED',
          originTabId: get().tabId,
          card,
          columnId,
        });
      }
    },

    editCard: (cardId, updates, origin) => {
      set((state) => {
        const existing = state.board.cardsById[cardId];
        if (!existing) return state;

        const updatedCard = { ...existing, ...updates };
        const newCardsById = { ...state.board.cardsById, [cardId]: updatedCard };
        const newBoard = { ...state.board, cardsById: newCardsById };
        debouncedSaveBoard(newBoard);
        return { board: newBoard };
      });

      if (origin === 'local') {
        postMessage({
          type: 'CARD_EDITED',
          originTabId: get().tabId,
          cardId,
          updates,
        });
      }
    },

    deleteCard: (cardId, origin) => {
      set((state) => {
        const { [cardId]: _, ...remainingCards } = state.board.cardsById;
        void _;
        const newColumns = state.board.columns.map((col) => ({
          ...col,
          cardIds: col.cardIds.filter((id) => id !== cardId),
        }));
        const newBoard = { ...state.board, columns: newColumns, cardsById: remainingCards };
        debouncedSaveBoard(newBoard);
        return {
          board: newBoard,
          selectedCardId: state.selectedCardId === cardId ? null : state.selectedCardId,
        };
      });

      if (origin === 'local') {
        postMessage({
          type: 'CARD_DELETED',
          originTabId: get().tabId,
          cardId,
        });
      }
    },

    moveCard: (cardId, fromColumnId, toColumnId, toIndex, origin) => {
      set((state) => {
        const newColumns = state.board.columns.map((col) => {
          if (col.id === fromColumnId && fromColumnId === toColumnId) {
            // Reorder within same column
            const cardIds = col.cardIds.filter((id) => id !== cardId);
            cardIds.splice(toIndex, 0, cardId);
            return { ...col, cardIds };
          }
          if (col.id === fromColumnId) {
            return { ...col, cardIds: col.cardIds.filter((id) => id !== cardId) };
          }
          if (col.id === toColumnId) {
            const cardIds = [...col.cardIds];
            cardIds.splice(toIndex, 0, cardId);
            return { ...col, cardIds };
          }
          return col;
        });
        const newBoard = { ...state.board, columns: newColumns };
        debouncedSaveBoard(newBoard);
        return { board: newBoard };
      });

      if (origin === 'local') {
        postMessage({
          type: 'CARD_MOVED',
          originTabId: get().tabId,
          cardId,
          fromColumnId,
          toColumnId,
          toIndex,
        });
      }
    },

    renameColumn: (columnId, newName, origin) => {
      set((state) => {
        const newColumns = state.board.columns.map((col) =>
          col.id === columnId ? { ...col, name: newName } : col
        );
        const newBoard = { ...state.board, columns: newColumns };
        debouncedSaveBoard(newBoard);
        return { board: newBoard };
      });

      if (origin === 'local') {
        postMessage({
          type: 'COLUMN_RENAMED',
          originTabId: get().tabId,
          columnId,
          newName,
        });
      }
    },

    setBoardTitle: (title, origin) => {
      set((state) => {
        const newBoard = { ...state.board, title };
        debouncedSaveBoard(newBoard);
        return { board: newBoard };
      });

      if (origin === 'local') {
        postMessage({
          type: 'BOARD_TITLE_CHANGED',
          originTabId: get().tabId,
          title,
        });
      }
    },

    addComment: (cardId, comment, origin) => {
      set((state) => {
        const existing = state.board.cardsById[cardId];
        if (!existing) return state;

        const updatedCard = {
          ...existing,
          comments: [...existing.comments, comment],
        };
        const newCardsById = { ...state.board.cardsById, [cardId]: updatedCard };
        const newBoard = { ...state.board, cardsById: newCardsById };
        debouncedSaveBoard(newBoard);
        return { board: newBoard };
      });

      if (origin === 'local') {
        postMessage({
          type: 'CARD_EDITED',
          originTabId: get().tabId,
          cardId,
          updates: {
            comments: get().board.cardsById[cardId]?.comments ?? [],
          },
        });
      }
    },

    appendActivityLog: (entry, origin) => {
      set((state) => {
        const newLog = [entry, ...state.activityLog].slice(0, MAX_ACTIVITY_LOG);
        debouncedSaveActivityLog(newLog);
        return { activityLog: newLog };
      });

      if (origin === 'local') {
        postMessage({
          type: 'ACTIVITY_LOG_APPEND',
          originTabId: get().tabId,
          entry,
        });
      }
    },

    // ── UI Actions ───────────────────────────────────────────────────

    setSelectedCardId: (id) => set({ selectedCardId: id }),
    setDraggingCardId: (id) => set({ draggingCardId: id }),
    setSearchQuery: (query) => set({ searchQuery: query }),
    setPriorityFilter: (filter) => set({ priorityFilter: filter }),
    setTabRegistry: (entries) => set({ tabRegistry: entries }),
    setTabLabel: (label) => set({ tabLabel: label }),

    replaceBoard: (board) => {
      debouncedSaveBoard(board);
      set({ board });
    },
  };
});

// ─── Selectors ─────────────────────────────────────────────────────────

export function useBoard() {
  return useBoardStore((s) => s.board);
}

export function useColumns() {
  return useBoardStore((s) => s.board.columns);
}

export function useCard(cardId: string) {
  return useBoardStore((s) => s.board.cardsById[cardId]);
}

export function useSelectedCard() {
  return useBoardStore((s) => {
    if (!s.selectedCardId) return null;
    return s.board.cardsById[s.selectedCardId] ?? null;
  });
}

export function useActivityLog() {
  return useBoardStore((s) => s.activityLog);
}

export function useTabCount() {
  return useBoardStore((s) => s.tabRegistry.length);
}

export function useFilteredCardIds(columnCardIds: string[]) {
  return useBoardStore(
    useShallow((s) => {
      const { searchQuery, priorityFilter } = s;
      const { cardsById } = s.board;

      return columnCardIds.filter((id) => {
        const card = cardsById[id];
        if (!card) return false;

        if (priorityFilter !== 'all' && card.priority !== priorityFilter) {
          return false;
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = card.title.toLowerCase().includes(q);
          const matchesDesc = card.description.toLowerCase().includes(q);
          if (!matchesTitle && !matchesDesc) return false;
        }

        return true;
      });
    })
  );
}
