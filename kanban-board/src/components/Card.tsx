'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { clsx } from 'clsx';
import { useBoardStore } from '@/store/board-store';
import { Badge } from '@/components/ui/Badge';
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
        'group bg-[#141516] rounded-lg p-3 border cursor-grab active:cursor-grabbing transition-all duration-150',
        isDragging && 'opacity-50 shadow-lg shadow-[#5e6ad2]/10 scale-[1.02]',
        isRemoteDragging && 'opacity-60 border-[#5e6ad2]/40 ring-1 ring-[#5e6ad2]/20',
        isSelected
          ? 'border-[#5e6ad2] ring-1 ring-[#5e6ad2]/30'
          : 'border-[#23252a] hover:border-[#34343a]'
      )}
    >
      {/* Title + Priority */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-medium text-[#f7f8f8] leading-snug line-clamp-2 flex-1">
          {card.title}
        </h3>
        <Badge priority={card.priority} />
      </div>

      {/* Footer: Due Date + Assignee */}
      <div className="flex items-center justify-between gap-2">
        {card.dueDate ? (
          <span
            className={clsx(
              'text-xs',
              overdue ? 'text-red-400' : 'text-[#62666d]'
            )}
          >
            {overdue && '⚠ '}
            {formatDate(card.dueDate)}
          </span>
        ) : (
          <span />
        )}

        {card.assignee && (
          <div
            className="flex items-center justify-center w-6 h-6 rounded-full bg-[#5e6ad2]/20 text-[#828fff] text-[10px] font-semibold shrink-0"
            title={card.assignee}
          >
            {getInitials(card.assignee)}
          </div>
        )}
      </div>
    </div>
  );
}
