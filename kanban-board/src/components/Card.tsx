'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { clsx } from 'clsx';
import { useBoardStore } from '@/store/board-store';
import { isOverdue, formatDate } from '@/utils/time';
import { getInitials } from '@/utils/constants';
import type { KanbanCard as KanbanCardType } from '@/types';

interface CardProps {
  card: KanbanCardType;
}

export function Card({ card }: CardProps) {
  const selectedCardId = useBoardStore((s) => s.selectedCardId);
  const draggingCardId = useBoardStore((s) => s.draggingCardId);
  const setSelectedCardId = useBoardStore((s) => s.setSelectedCardId);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isSelected = selectedCardId === card.id;
  const isRemoteDragging = draggingCardId === card.id;
  const overdue = isOverdue(card.dueDate);

  // Generate a mock key for visual polish, like PUL-102
  const issueKey = `PUL-${card.id.slice(0, 3).toUpperCase()}`;

  const renderPriorityIcon = () => {
    switch (card.priority) {
      case 'high':
        return (
          <span
            className="material-symbols-outlined text-danger text-[18px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
            title="High Priority"
          >
            signal_cellular_alt
          </span>
        );
      case 'medium':
        return (
          <span className="material-symbols-outlined text-warning text-[18px]" title="Medium Priority">
            signal_cellular_alt_2_bar
          </span>
        );
      case 'low':
      default:
        return (
          <span className="material-symbols-outlined text-primary text-[18px]" title="Low Priority">
            signal_cellular_alt_1_bar
          </span>
        );
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedCardId(card.id);
      }}
      className={clsx(
        'group relative overflow-hidden bg-surface p-md rounded-xl border shadow-sm cursor-grab active:cursor-grabbing transition-all duration-150 hover:bg-hover',
        isDragging && 'opacity-50 shadow-lg scale-[1.02]',
        isRemoteDragging && 'opacity-60 border-primary/40 ring-1 ring-primary/20',
        isSelected
          ? 'border-2 border-primary'
          : 'border-border hover:border-primary/50'
      )}
    >
      {/* Top Color Strip */}
      {card.color && (
        <div
          style={{ backgroundColor: card.color }}
          className="absolute top-0 left-0 right-0 h-1.5"
        />
      )}

      {/* Header: Key + Priority */}
      <div className={clsx("flex items-center justify-between mb-sm", card.color && "mt-xs")}>
        <span className="font-label-sm text-[10px] text-outline font-bold">{issueKey}</span>
        {renderPriorityIcon()}
      </div>

      {/* Title */}
      <h3 className="font-body-md text-body-md text-on-surface font-semibold mb-lg leading-tight line-clamp-2">
        {card.title}
      </h3>

      {/* Footer: Due Date + Assignee */}
      <div className="flex items-center justify-between mt-auto">
        {card.dueDate ? (
          <div
            className={clsx(
              'flex items-center gap-xs font-medium text-[11px]',
              overdue ? 'text-danger font-bold animate-pulse' : 'text-outline'
            )}
          >
            <span className="material-symbols-outlined text-[16px]">
              {overdue ? 'schedule' : 'calendar_today'}
            </span>
            <span>{overdue ? 'Today' : formatDate(card.dueDate)}</span>
          </div>
        ) : (
          <div />
        )}

        {card.assignee && (
          <div
            className="flex items-center justify-center w-6 h-6 rounded-full bg-primary-container text-on-primary text-[10px] font-bold border border-outline-variant shrink-0"
            title={card.assignee}
          >
            {getInitials(card.assignee)}
          </div>
        )}
      </div>
    </div>
  );
}
