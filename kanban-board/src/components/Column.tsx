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

  const getColumnIcon = () => {
    const name = column.name.toLowerCase();
    if (name.includes('todo') || name.includes('to do')) {
      return <span className="material-symbols-outlined text-primary text-[18px]">circle</span>;
    }
    if (name.includes('progress')) {
      return <span className="material-symbols-outlined text-warning text-[18px]">change_history</span>;
    }
    if (name.includes('review')) {
      return <span className="material-symbols-outlined text-secondary text-[18px]">assignment_turned_in</span>;
    }
    if (name.includes('done')) {
      return (
        <span className="material-symbols-outlined text-success text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
          check_circle
        </span>
      );
    }
    return <span className="material-symbols-outlined text-outline text-[18px]">circle</span>;
  };

  const getEmptyStateIcon = () => {
    const name = column.name.toLowerCase();
    if (name.includes('review')) return 'assignment_turned_in';
    if (name.includes('done')) return 'check_circle';
    if (name.includes('progress')) return 'sync';
    return 'assignment';
  };

  return (
    <div className="w-80 flex flex-col gap-md shrink-0">
      {/* Column Header */}
      <div className="flex justify-between items-center px-xs mb-xs">
        <div className="flex items-center gap-sm">
          {getColumnIcon()}
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
              className="bg-surface text-on-surface text-sm font-semibold px-2 py-0.5 rounded border border-primary outline-none w-40"
            />
          ) : (
            <h2
              onDoubleClick={() => setIsRenaming(true)}
              className="font-label-sm text-sm font-bold uppercase tracking-wider text-on-surface cursor-default select-none truncate"
              title="Double-click to rename"
            >
              {column.name}
            </h2>
          )}
          {/* Card Count Badge */}
          <span className="px-1.5 py-0.5 bg-surface-container rounded-full text-[10px] font-bold text-outline">
            {filteredCardIds.length}
          </span>
        </div>
        
        <button 
          onClick={() => setIsAddingCard(true)}
          className="text-outline hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
        </button>
      </div>

      {/* Cards Area / Droppable container */}
      <div 
        ref={setNodeRef} 
        className={`flex-1 flex flex-col gap-sm min-h-[200px] p-2 rounded-xl transition-colors ${
          isOver ? 'bg-primary-container/10 border-2 border-dashed border-primary/30' : ''
        }`}
      >
        {filteredCardIds.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-md border border-dashed border-outline-variant rounded-xl py-xl text-outline opacity-50">
            <span className="material-symbols-outlined text-[32px] mb-sm">
              {getEmptyStateIcon()}
            </span>
            <p className="font-label-sm text-xs">Drop here</p>
          </div>
        ) : (
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
        )}
      </div>

      {/* Add Card Control */}
      <div className="px-xs pt-xs">
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
            className="w-full bg-surface text-on-surface text-sm px-3 py-1.5 rounded-lg border border-primary outline-none placeholder:text-outline"
          />
        ) : (
          <button
            onClick={() => setIsAddingCard(true)}
            className="w-full text-xs font-semibold text-on-surface-variant hover:text-primary hover:bg-hover rounded-lg py-1.5 transition-colors border border-dashed border-outline-variant bg-surface"
          >
            + Add card
          </button>
        )}
      </div>
    </div>
  );
}
