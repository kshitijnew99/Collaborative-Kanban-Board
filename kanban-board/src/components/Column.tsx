'use client';

import { useState, useRef, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useBoardStore, useFilteredCardIds } from '@/store/board-store';
import { Card } from '@/components/Card';
import { generateId } from '@/utils/id';
import type { Column as ColumnType } from '@/types';

interface ColumnProps {
  column: ColumnType;
}

export function Column({ column }: ColumnProps) {
  const cardsById = useBoardStore((s) => s.board.cardsById);
  const createCard = useBoardStore((s) => s.createCard);
  const renameColumn = useBoardStore((s) => s.renameColumn);
  const appendActivityLog = useBoardStore((s) => s.appendActivityLog);
  const tabId = useBoardStore((s) => s.tabId);
  const tabLabel = useBoardStore((s) => s.tabLabel);

  const filteredCardIds = useFilteredCardIds(column.cardIds);

  const [isRenaming, setIsRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState(column.name);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);
  const addCardInputRef = useRef<HTMLInputElement>(null);

  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  // Focus inputs when editing state changes
  useEffect(() => {
    if (isRenaming && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [isRenaming]);

  useEffect(() => {
    if (isAddingCard && addCardInputRef.current) {
      addCardInputRef.current.focus();
    }
  }, [isAddingCard]);

  // Sync name draft when remote rename happens
  useEffect(() => {
    setNameDraft(column.name);
  }, [column.name]);

  const commitRename = () => {
    const trimmed = nameDraft.trim();
    if (trimmed && trimmed !== column.name) {
      renameColumn(column.id, trimmed, 'local');
      appendActivityLog(
        {
          id: generateId(),
          description: `Column renamed to "${trimmed}"`,
          timestamp: Date.now(),
          tabId,
          tabLabel,
        },
        'local'
      );
    } else {
      setNameDraft(column.name);
    }
    setIsRenaming(false);
  };

  const handleAddCard = () => {
    const trimmed = newCardTitle.trim();
    if (trimmed) {
      createCard(column.id, trimmed, 'local');
      appendActivityLog(
        {
          id: generateId(),
          description: `Card "${trimmed}" created in ${column.name}`,
          timestamp: Date.now(),
          tabId,
          tabLabel,
        },
        'local'
      );
      setNewCardTitle('');
      setIsAddingCard(false);
    }
  };

  return (
    <div
      className={`flex flex-col bg-[#0f1011]/60 rounded-xl border w-72 shrink-0 transition-colors ${
        isOver ? 'border-[#5e6ad2]/50 bg-[#5e6ad2]/5' : 'border-[#23252a]'
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#23252a]">
        {isRenaming ? (
          <input
            ref={renameInputRef}
            type="text"
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitRename();
              if (e.key === 'Escape') {
                setNameDraft(column.name);
                setIsRenaming(false);
              }
            }}
            className="bg-[#141516] text-[#f7f8f8] text-sm font-semibold px-2 py-0.5 rounded border border-[#5e6ad2] outline-none flex-1 mr-2"
          />
        ) : (
          <h2
            onDoubleClick={() => setIsRenaming(true)}
            className="text-sm font-semibold text-[#d0d6e0] cursor-default select-none truncate"
            title="Double-click to rename"
          >
            {column.name}
          </h2>
        )}
        {/* Card Count Badge */}
        <span className="flex items-center justify-center min-w-[20px] h-5 rounded-full bg-[#141516] text-[#8a8f98] text-xs font-medium px-1.5 border border-[#23252a]">
          {filteredCardIds.length}
        </span>
      </div>

      {/* Cards */}
      <div ref={setNodeRef} className="flex-1 p-2 space-y-2 min-h-[60px] overflow-y-auto">
        <SortableContext
          items={filteredCardIds}
          strategy={verticalListSortingStrategy}
        >
          {filteredCardIds.map((cardId) => {
            const card = cardsById[cardId];
            if (!card) return null;
            return <Card key={cardId} card={card} />;
          })}
        </SortableContext>
      </div>

      {/* Add Card */}
      <div className="p-2 border-t border-[#23252a]">
        {isAddingCard ? (
          <input
            ref={addCardInputRef}
            type="text"
            placeholder="Enter card title..."
            value={newCardTitle}
            onChange={(e) => setNewCardTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddCard();
              if (e.key === 'Escape') {
                setNewCardTitle('');
                setIsAddingCard(false);
              }
            }}
            onBlur={() => {
              if (!newCardTitle.trim()) {
                setIsAddingCard(false);
              }
            }}
            className="w-full bg-[#141516] text-[#f7f8f8] text-sm px-3 py-1.5 rounded-lg border border-[#5e6ad2] outline-none placeholder:text-[#62666d]"
          />
        ) : (
          <button
            onClick={() => setIsAddingCard(true)}
            className="w-full text-sm text-[#62666d] hover:text-[#8a8f98] hover:bg-[#141516] rounded-lg py-1.5 transition-colors cursor-pointer"
          >
            + Add card
          </button>
        )}
      </div>
    </div>
  );
}
