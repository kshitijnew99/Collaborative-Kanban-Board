'use client';

import { useEffect } from 'react';
import { onMessage } from '@/broadcast/channel';
import { useBoardStore } from '@/store/board-store';
import type { BroadcastMessage } from '@/types';

/**
 * Listens for BroadcastChannel messages and applies remote actions to the store.
 * Must be called once at the app root.
 *
 * Echo-loop prevention:
 * 1. We check originTabId !== myTabId (safety guard).
 * 2. All store calls use origin: 'remote', so the store never re-broadcasts.
 */
export function useBroadcastSync(): void {
  const tabId = useBoardStore((s) => s.tabId);

  useEffect(() => {
    const cleanup = onMessage((msg: BroadcastMessage) => {
      // Safety guard: ignore our own messages
      if (msg.originTabId === tabId) return;

      const store = useBoardStore.getState();

      // Exhaustive switch — no default escape hatch
      switch (msg.type) {
        case 'CARD_CREATED':
          // Apply the pre-built card directly instead of re-generating an ID
          useBoardStore.setState((state) => {
            const newCardsById = { ...state.board.cardsById, [msg.card.id]: msg.card };
            const newColumns = state.board.columns.map((col) =>
              col.id === msg.columnId
                ? { ...col, cardIds: [...col.cardIds, msg.card.id] }
                : col
            );
            return {
              board: { ...state.board, columns: newColumns, cardsById: newCardsById },
            };
          });
          break;

        case 'CARD_EDITED':
          store.editCard(msg.cardId, msg.updates, 'remote');
          break;

        case 'CARD_DELETED':
          store.deleteCard(msg.cardId, 'remote');
          break;

        case 'CARD_MOVED':
          store.moveCard(msg.cardId, msg.fromColumnId, msg.toColumnId, msg.toIndex, 'remote');
          break;

        case 'DRAG_START':
          store.setDraggingCardId(msg.cardId);
          break;

        case 'DRAG_END':
          store.setDraggingCardId(null);
          break;

        case 'COLUMN_RENAMED':
          store.renameColumn(msg.columnId, msg.newName, 'remote');
          break;

        case 'BOARD_TITLE_CHANGED':
          store.setBoardTitle(msg.title, 'remote');
          break;

        case 'TAB_JOIN':
          // Handled by useTabRegistry
          break;

        case 'TAB_HEARTBEAT':
          // Handled by useTabRegistry
          break;

        case 'TAB_LEAVE':
          // Handled by useTabRegistry
          break;

        case 'ACTIVITY_LOG_APPEND':
          store.appendActivityLog(msg.entry, 'remote');
          break;
      }
    });

    return cleanup;
  }, [tabId]);
}
