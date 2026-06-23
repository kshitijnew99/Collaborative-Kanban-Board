'use client';

import { useState, useRef, useEffect } from 'react';
import { useBoardStore, useSelectedCard } from '@/store/board-store';
import { ConfirmPrompt } from '@/components/ui/ConfirmPrompt';
import type { Priority } from '@/types';
import { DEFAULT_ASSIGNEES, getInitials } from '@/utils/constants';
import { generateId } from '@/utils/id';
import { relativeTime } from '@/utils/time';

const PRIORITY_OPTIONS: Priority[] = ['low', 'medium', 'high'];

export function EditPanel() {
  const card = useSelectedCard();
  const selectedCardId = useBoardStore((s) => s.selectedCardId);
  const columns = useBoardStore((s) => s.board.columns);
  const editCard = useBoardStore((s) => s.editCard);
  const deleteCard = useBoardStore((s) => s.deleteCard);
  const addComment = useBoardStore((s) => s.addComment);
  const setSelectedCardId = useBoardStore((s) => s.setSelectedCardId);
  const appendActivityLog = useBoardStore((s) => s.appendActivityLog);
  const tabId = useBoardStore((s) => s.tabId);
  const tabLabel = useBoardStore((s) => s.tabLabel);

  const [commentText, setCommentText] = useState('');
  const [commentAuthor, setCommentAuthor] = useState<string>(DEFAULT_ASSIGNEES[0]);
  const commentInputRef = useRef<HTMLInputElement>(null);

  // Local drafts for title & description to prevent flooding the activity feed on every keystroke
  const [localTitle, setLocalTitle] = useState('');
  const [localDescription, setLocalDescription] = useState('');
  const isTitleFocused = useRef(false);
  const isDescriptionFocused = useRef(false);

  useEffect(() => {
    if (card) {
      if (!isTitleFocused.current) {
        setLocalTitle(card.title);
      }
      if (!isDescriptionFocused.current) {
        setLocalDescription(card.description || '');
      }
    }
  }, [card]);

  // Reset comment input when card changes
  useEffect(() => {
    setCommentText('');
  }, [selectedCardId]);

  if (!card || !selectedCardId) return null;

  // Retrieve current column name
  const currentColumn = columns.find((c) => c.cardIds.includes(card.id));
  const columnName = currentColumn?.name ?? 'Todo';

  const handleFieldChange = (field: string, value: string | null) => {
    editCard(selectedCardId, { [field]: value }, 'local');
    appendActivityLog(
      {
        id: generateId(),
        description: `Card "${card.title}" updated (${field})`,
        timestamp: Date.now(),
        tabId,
        tabLabel,
      },
      'local'
    );
  };

  const handleDelete = () => {
    const title = card.title;
    deleteCard(selectedCardId, 'local');
    appendActivityLog(
      {
        id: generateId(),
        description: `Card "${title}" deleted`,
        timestamp: Date.now(),
        tabId,
        tabLabel,
      },
      'local'
    );
  };

  const handleAddComment = () => {
    const trimmed = commentText.trim();
    if (!trimmed) return;

    const comment = {
      id: generateId(),
      author: commentAuthor,
      text: trimmed,
      createdAt: Date.now(),
    };
    addComment(selectedCardId, comment, 'local');
    appendActivityLog(
      {
        id: generateId(),
        description: `Comment added on "${card.title}"`,
        timestamp: Date.now(),
        tabId,
        tabLabel,
      },
      'local'
    );
    setCommentText('');
  };

  // Generate issue key like PUL-F64
  const issueKey = `PUL-${card.id.slice(0, 3).toUpperCase()}`;

  return (
    <aside className="w-[450px] bg-surface border-l border-outline-variant flex flex-col overflow-hidden shadow-2xl relative z-40 h-[calc(100vh-64px)]">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-lg py-md border-b border-outline-variant shrink-0">
        <div className="flex items-center gap-md">
          <button
            onClick={() => setSelectedCardId(null)}
            className="p-1 text-on-surface-variant hover:bg-hover rounded transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
          <span className="font-label-sm text-xs font-bold text-outline">{issueKey}</span>
        </div>
        <div className="flex items-center gap-sm">
          <button className="p-1.5 text-on-surface-variant hover:bg-hover rounded transition-colors">
            <span className="material-symbols-outlined text-[18px]">share</span>
          </button>
          <button className="p-1.5 text-on-surface-variant hover:bg-hover rounded transition-colors">
            <span className="material-symbols-outlined text-[18px]">more_vert</span>
          </button>
        </div>
      </div>

      {/* Panel Scrollable Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-lg flex flex-col gap-lg">
        {/* Title */}
        <section>
          <textarea
            value={localTitle}
            onChange={(e) => setLocalTitle(e.target.value)}
            onFocus={() => {
              isTitleFocused.current = true;
            }}
            onBlur={() => {
              isTitleFocused.current = false;
              if (localTitle.trim() && localTitle !== card.title) {
                handleFieldChange('title', localTitle.trim());
              }
            }}
            rows={2}
            className="w-full font-headline-sm text-lg font-bold bg-transparent border-none resize-none p-0 focus:ring-0 leading-tight outline-none"
          />
        </section>

        {/* Attributes Grid */}
        <section className="grid grid-cols-2 gap-md py-md border-y border-outline-variant">
          {/* Status (Column Name) */}
          <div className="flex flex-col gap-xs">
            <label className="font-label-sm text-[10px] text-outline font-bold uppercase tracking-wider">Status</label>
            <div className="flex items-center gap-sm px-sm py-1.5 bg-hover rounded-lg w-full text-left">
              <span className="material-symbols-outlined text-[18px] text-warning">
                radio_button_checked
              </span>
              <span className="font-body-md text-sm text-on-surface font-semibold">{columnName}</span>
            </div>
          </div>

          {/* Assignee */}
          <div className="flex flex-col gap-xs">
            <label className="font-label-sm text-[10px] text-outline font-bold uppercase tracking-wider">Assignee</label>
            <select
              value={card.assignee ?? ''}
              onChange={(e) => handleFieldChange('assignee', e.target.value || null)}
              className="flex items-center gap-sm px-sm py-1.5 bg-hover rounded-lg border-none focus:ring-0 text-sm font-semibold text-on-surface w-full cursor-pointer outline-none"
            >
              <option value="">Unassigned</option>
              {DEFAULT_ASSIGNEES.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority (Segmented Control) */}
          <div className="flex flex-col gap-xs">
            <label className="font-label-sm text-[10px] text-outline font-bold uppercase tracking-wider">Priority</label>
            <div className="flex bg-hover p-0.5 rounded-lg border border-outline-variant">
              {PRIORITY_OPTIONS.map((p) => (
                <button
                  key={p}
                  onClick={() => handleFieldChange('priority', p)}
                  className={`flex-grow flex justify-center py-1 rounded-md transition-all cursor-pointer ${
                    card.priority === p ? 'bg-surface shadow-sm font-bold' : 'text-outline hover:text-on-surface'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[18px] ${
                      card.priority === p
                        ? p === 'high'
                          ? 'text-danger'
                          : p === 'medium'
                            ? 'text-warning'
                            : 'text-primary'
                        : 'text-outline'
                    }`}
                    style={{ fontVariationSettings: card.priority === p && p === 'high' ? "'FILL' 1" : undefined }}
                  >
                    {p === 'high' ? 'signal_cellular_alt' : p === 'medium' ? 'signal_cellular_alt_2_bar' : 'signal_cellular_alt_1_bar'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Due Date */}
          <div className="flex flex-col gap-xs">
            <label className="font-label-sm text-[10px] text-outline font-bold uppercase tracking-wider">Due Date</label>
            <input
              type="date"
              value={card.dueDate ?? ''}
              onChange={(e) => handleFieldChange('dueDate', e.target.value || null)}
              className="w-full bg-hover text-on-surface text-sm px-sm py-1.5 rounded-lg border-none focus:ring-0 outline-none [color-scheme:light] font-semibold"
            />
          </div>

          {/* Card Color Picker */}
          <div className="flex flex-col gap-xs col-span-2 mt-xs">
            <label className="font-label-sm text-[10px] text-outline font-bold uppercase tracking-wider">Card Color</label>
            <div className="flex gap-md mt-xs">
              {['#f87171', '#fbbf24', '#34d399', '#60a5fa', '#c084fc'].map((color) => (
                <button
                  key={color}
                  onClick={() => handleFieldChange('color', card.color === color ? null : color)}
                  style={{ backgroundColor: color }}
                  className={`w-6 h-6 rounded-full border-2 transition-all cursor-pointer ${
                    card.color === color ? 'border-primary scale-110 shadow-sm' : 'border-transparent hover:scale-105'
                  }`}
                  title="Select card color"
                />
              ))}
            </div>
          </div>
        </section>

        {/* Description */}
        <section>
          <label className="font-label-sm text-[10px] text-outline font-bold uppercase tracking-wider mb-sm block">
            Description
          </label>
          <textarea
            value={localDescription}
            onChange={(e) => setLocalDescription(e.target.value)}
            onFocus={() => {
              isDescriptionFocused.current = true;
            }}
            onBlur={() => {
              isDescriptionFocused.current = false;
              if (localDescription !== (card.description || '')) {
                handleFieldChange('description', localDescription || null);
              }
            }}
            placeholder="Add a description..."
            rows={5}
            className="w-full bg-transparent text-on-surface text-sm border-none focus:ring-0 outline-none resize-none placeholder:text-outline/70 leading-relaxed"
          />
        </section>

        {/* Comments Section */}
        <section className="mt-md">
          <label className="font-label-sm text-[10px] text-outline font-bold uppercase tracking-wider mb-lg block">
            Comments ({card.comments.length})
          </label>

          {/* Comment List */}
          <div className="space-y-4 mb-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {card.comments.length === 0 ? (
              <p className="text-xs text-outline italic">No comments yet</p>
            ) : (
              card.comments.map((comment) => (
                <div key={comment.id} className="flex gap-md">
                  <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0 border border-outline-variant">
                    {getInitials(comment.author)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-sm mb-xs">
                      <span className="font-label-sm text-xs font-bold text-on-surface">
                        {comment.author}
                      </span>
                      <span className="text-[10px] text-outline">
                        {relativeTime(comment.createdAt)}
                      </span>
                    </div>
                    <p className="font-body-md text-xs text-on-surface-variant leading-relaxed">
                      {comment.text}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add Comment Input Bar */}
          <div className="mt-lg pt-lg border-t border-outline-variant">
            <div className="flex gap-md items-center">
              <select
                value={commentAuthor}
                onChange={(e) => setCommentAuthor(e.target.value)}
                className="bg-hover text-on-surface text-xs px-2 py-1.5 rounded-lg border-none focus:ring-0 outline-none w-28 shrink-0 cursor-pointer font-semibold"
              >
                {DEFAULT_ASSIGNEES.map((name) => (
                  <option key={name} value={name}>
                    {name.split(' ')[0]}
                  </option>
                ))}
              </select>
              <div className="flex-grow relative flex items-center">
                <input
                  ref={commentInputRef}
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddComment();
                  }}
                  className="w-full px-md py-2 bg-background border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:outline-none text-xs pr-10"
                />
                <button
                  onClick={handleAddComment}
                  disabled={!commentText.trim()}
                  className="absolute right-2 text-primary hover:bg-selected p-1 rounded-md transition-colors disabled:opacity-30 cursor-pointer flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-[18px]">send</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Delete */}
        <div className="pt-4 mt-lg border-t border-outline-variant">
          <ConfirmPrompt
            label="Delete Card"
            onConfirm={handleDelete}
            className="w-full text-xs font-semibold py-2 rounded-lg"
          />
        </div>
      </div>
    </aside>
  );
}
