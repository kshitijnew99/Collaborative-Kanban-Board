'use client';

import { useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent, DragOverEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useBoardStore, useColumns } from '@/store/board-store';
import { postMessage } from '@/broadcast/channel';
import { Column } from '@/components/Column';
import { EditPanel } from '@/components/EditPanel';
import { generateId } from '@/utils/id';
import type { Column as ColumnType } from '@/types';

export function Board() {
  const columns = useColumns();
  const cardsById = useBoardStore((s) => s.board.cardsById);
  const moveCard = useBoardStore((s) => s.moveCard);
  const selectedCardId = useBoardStore((s) => s.selectedCardId);
  const setSelectedCardId = useBoardStore((s) => s.setSelectedCardId);
  const appendActivityLog = useBoardStore((s) => s.appendActivityLog);
  const tabId = useBoardStore((s) => s.tabId);
  const tabLabel = useBoardStore((s) => s.tabLabel);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const findColumnByCardId = useCallback(
    (cardId: string): ColumnType | undefined => {
      return columns.find((col) => col.cardIds.includes(cardId));
    },
    [columns]
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const cardId = String(event.active.id);
      // Broadcast DRAG_START to other tabs
      postMessage({
        type: 'DRAG_START',
        originTabId: tabId,
        cardId,
      });
    },
    [tabId]
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeId = String(active.id);
      const overId = String(over.id);

      if (activeId === overId) return;

      const activeColumn = findColumnByCardId(activeId);
      // over could be a column ID or a card ID
      const overColumn = columns.find((col) => col.id === overId) ?? findColumnByCardId(overId);

      if (!activeColumn || !overColumn) return;
      if (activeColumn.id === overColumn.id) return;

      // Move card to new column (append to end for now, handleDragEnd will finalize position)
      const toIndex = overColumn.cardIds.indexOf(overId);
      const finalIndex = toIndex >= 0 ? toIndex : overColumn.cardIds.length;

      moveCard(activeId, activeColumn.id, overColumn.id, finalIndex, 'local');
    },
    [columns, findColumnByCardId, moveCard]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      // Broadcast DRAG_END
      postMessage({
        type: 'DRAG_END',
        originTabId: tabId,
        cardId: String(active.id),
      });

      if (!over) return;

      const activeId = String(active.id);
      const overId = String(over.id);

      const activeColumn = findColumnByCardId(activeId);
      const overColumn = columns.find((col) => col.id === overId) ?? findColumnByCardId(overId);

      if (!activeColumn || !overColumn) return;

      if (activeColumn.id === overColumn.id) {
        // Reorder within same column
        const oldIndex = activeColumn.cardIds.indexOf(activeId);
        const newIndex = activeColumn.cardIds.indexOf(overId);

        if (oldIndex !== newIndex && newIndex >= 0) {
          const newCardIds = arrayMove(activeColumn.cardIds, oldIndex, newIndex);
          const toIndex = newCardIds.indexOf(activeId);

          moveCard(activeId, activeColumn.id, activeColumn.id, toIndex, 'local');

          const card = cardsById[activeId];
          if (card) {
            appendActivityLog(
              {
                id: generateId(),
                description: `Card "${card.title}" reordered in ${activeColumn.name}`,
                timestamp: Date.now(),
                tabId,
                tabLabel,
              },
              'local'
            );
          }
        }
      } else {
        // Cross-column move already handled in dragOver, log it
        const card = cardsById[activeId];
        if (card) {
          appendActivityLog(
            {
              id: generateId(),
              description: `Card "${card.title}" moved from ${activeColumn.name} to ${overColumn.name}`,
              timestamp: Date.now(),
              tabId,
              tabLabel,
            },
            'local'
          );
        }
      }
    },
    [columns, cardsById, findColumnByCardId, moveCard, appendActivityLog, tabId, tabLabel]
  );

  return (
    <div className="flex-1 flex min-h-0 relative" onClick={() => setSelectedCardId(null)}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {/* Columns */}
        <div
          className={`flex-1 flex gap-lg p-lg overflow-x-auto bg-background custom-scrollbar transition-opacity duration-300 ${
            selectedCardId ? 'opacity-50' : ''
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {columns.map((column) => (
            <Column key={column.id} column={column} />
          ))}
        </div>

        <DragOverlay dropAnimation={null}>
          {/* Drag overlay is handled by dnd-kit's default behavior */}
          {null}
        </DragOverlay>
      </DndContext>

      {/* Edit Panel */}
      {selectedCardId && (
        <div onClick={(e) => e.stopPropagation()} className="shrink-0 flex">
          <EditPanel />
        </div>
      )}
    </div>
  );
}
