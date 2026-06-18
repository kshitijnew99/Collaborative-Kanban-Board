'use client';

import { useState, useRef, useEffect } from 'react';
import { useBoardStore, useSelectedCard } from '@/store/board-store';
import { Button } from '@/components/ui/Button';
import { ConfirmPrompt } from '@/components/ui/ConfirmPrompt';
import type { Priority } from '@/types';
import { DEFAULT_ASSIGNEES, getInitials } from '@/utils/constants';
import { generateId } from '@/utils/id';

const PRIORITY_OPTIONS: Priority[] = ['high', 'medium', 'low'];

export function EditPanel() {
  const card = useSelectedCard();
  const selectedCardId = useBoardStore((s) => s.selectedCardId);
  const editCard = useBoardStore((s) => s.editCard);
  const deleteCard = useBoardStore((s) => s.deleteCard);
  const addComment = useBoardStore((s) => s.addComment);
  const setSelectedCardId = useBoardStore((s) => s.setSelectedCardId);
  const appendActivityLog = useBoardStore((s) => s.appendActivityLog);
  const tabId = useBoardStore((s) => s.tabId);
  const tabLabel = useBoardStore((s) => s.tabLabel);

  const [commentText, setCommentText] = useState('');
  const [commentAuthor, setCommentAuthor] = useState<string>(DEFAULT_ASSIGNEES[0]);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  // Reset comment input when card changes
  useEffect(() => {
    setCommentText('');
  }, [selectedCardId]);

  if (!card || !selectedCardId) return null;

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
    setCommentText('');
  };

  return (
    <div className="w-80 bg-[#0f1011] border-l border-[#23252a] flex flex-col shrink-0 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#23252a]">
        <h2 className="text-sm font-semibold text-[#d0d6e0]">Edit Card</h2>
        <button
          onClick={() => setSelectedCardId(null)}
          className="text-[#62666d] hover:text-[#f7f8f8] transition-colors cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* Title */}
        <div>
          <label className="block text-xs font-medium text-[#8a8f98] mb-1">Title</label>
          <input
            type="text"
            value={card.title}
            onChange={(e) => handleFieldChange('title', e.target.value)}
            className="w-full bg-[#141516] text-[#f7f8f8] text-sm px-3 py-2 rounded-lg border border-[#23252a] focus:border-[#5e6ad2] outline-none"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-[#8a8f98] mb-1">Description</label>
          <textarea
            value={card.description}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            placeholder="Add a description..."
            rows={3}
            className="w-full bg-[#141516] text-[#f7f8f8] text-sm px-3 py-2 rounded-lg border border-[#23252a] focus:border-[#5e6ad2] outline-none resize-none placeholder:text-[#62666d]"
          />
        </div>

        {/* Priority */}
        <div>
          <label className="block text-xs font-medium text-[#8a8f98] mb-1">Priority</label>
          <div className="flex gap-1">
            {PRIORITY_OPTIONS.map((p) => (
              <button
                key={p}
                onClick={() => handleFieldChange('priority', p)}
                className={`flex-1 text-xs font-medium py-1.5 rounded-lg border transition-colors cursor-pointer ${
                  card.priority === p
                    ? p === 'high'
                      ? 'bg-red-500/20 text-red-400 border-red-500/30'
                      : p === 'medium'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                    : 'bg-[#141516] text-[#8a8f98] border-[#23252a] hover:border-[#34343a]'
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Due Date */}
        <div>
          <label className="block text-xs font-medium text-[#8a8f98] mb-1">Due Date</label>
          <input
            type="date"
            value={card.dueDate ?? ''}
            onChange={(e) => handleFieldChange('dueDate', e.target.value || null)}
            className="w-full bg-[#141516] text-[#f7f8f8] text-sm px-3 py-2 rounded-lg border border-[#23252a] focus:border-[#5e6ad2] outline-none [color-scheme:dark]"
          />
        </div>

        {/* Assignee */}
        <div>
          <label className="block text-xs font-medium text-[#8a8f98] mb-1">Assignee</label>
          <select
            value={card.assignee ?? ''}
            onChange={(e) => handleFieldChange('assignee', e.target.value || null)}
            className="w-full bg-[#141516] text-[#f7f8f8] text-sm px-3 py-2 rounded-lg border border-[#23252a] focus:border-[#5e6ad2] outline-none cursor-pointer"
          >
            <option value="">Unassigned</option>
            {DEFAULT_ASSIGNEES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {/* Comments Section */}
        <div>
          <label className="block text-xs font-medium text-[#8a8f98] mb-2">
            Comments ({card.comments.length})
          </label>

          {/* Comment List */}
          <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
            {card.comments.length === 0 && (
              <p className="text-xs text-[#62666d] italic">No comments yet</p>
            )}
            {card.comments.map((comment) => (
              <div
                key={comment.id}
                className="bg-[#141516] rounded-lg p-2.5 border border-[#23252a]"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded-full bg-[#5e6ad2]/20 text-[#828fff] text-[9px] font-semibold flex items-center justify-center">
                    {getInitials(comment.author)}
                  </div>
                  <span className="text-xs font-medium text-[#d0d6e0]">
                    {comment.author}
                  </span>
                  <span className="text-[10px] text-[#62666d] ml-auto">
                    {new Date(comment.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-[#8a8f98] leading-relaxed">{comment.text}</p>
              </div>
            ))}
          </div>

          {/* Add Comment */}
          <div className="space-y-2">
            <select
              value={commentAuthor}
              onChange={(e) => setCommentAuthor(e.target.value)}
              className="w-full bg-[#141516] text-[#f7f8f8] text-xs px-2 py-1.5 rounded-lg border border-[#23252a] focus:border-[#5e6ad2] outline-none cursor-pointer"
            >
              {DEFAULT_ASSIGNEES.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <textarea
              ref={commentInputRef}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              rows={2}
              className="w-full bg-[#141516] text-[#f7f8f8] text-xs px-3 py-2 rounded-lg border border-[#23252a] focus:border-[#5e6ad2] outline-none resize-none placeholder:text-[#62666d]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleAddComment();
                }
              }}
            />
            <Button variant="primary" onClick={handleAddComment} disabled={!commentText.trim()} className="w-full text-xs">
              Add Comment
            </Button>
          </div>
        </div>

        {/* Delete */}
        <div className="pt-2 border-t border-[#23252a]">
          <ConfirmPrompt
            label="Delete Card"
            onConfirm={handleDelete}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
