// ─── Priority ──────────────────────────────────────────────────────────
export type Priority = 'high' | 'medium' | 'low';

// ─── Comment ───────────────────────────────────────────────────────────
export interface Comment {
  id: string;
  author: string;
  text: string;
  createdAt: number;
}

// ─── KanbanCard ────────────────────────────────────────────────────────
export interface KanbanCard {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  dueDate: string | null;
  assignee: string | null;
  color: string | null;
  labels: string[];
  metadata: Record<string, unknown>;
  comments: Comment[];
  createdAt: number;
}

// ─── Column ────────────────────────────────────────────────────────────
export interface Column {
  id: string;
  name: string;
  cardIds: string[];
}

// ─── Board ─────────────────────────────────────────────────────────────
export interface Board {
  title: string;
  columns: Column[];
  cardsById: Record<string, KanbanCard>;
}

// ─── Activity Log ──────────────────────────────────────────────────────
export interface ActivityLogEntry {
  id: string;
  description: string;
  timestamp: number;
  tabId: string;
  tabLabel: string;
}

// ─── Tab Registry ──────────────────────────────────────────────────────
export interface TabRegistryEntry {
  tabId: string;
  lastSeen: number;
}

// ─── Action Origin ─────────────────────────────────────────────────────
export type ActionOrigin = 'local' | 'remote';

// ─── BroadcastMessage ──────────────────────────────────────────────────
// Discriminated union on `type`. Every variant includes `originTabId`.

export interface CardCreatedMessage {
  type: 'CARD_CREATED';
  originTabId: string;
  card: KanbanCard;
  columnId: string;
}

export interface CardEditedMessage {
  type: 'CARD_EDITED';
  originTabId: string;
  cardId: string;
  updates: Partial<Omit<KanbanCard, 'id' | 'createdAt'>>;
}

export interface CardDeletedMessage {
  type: 'CARD_DELETED';
  originTabId: string;
  cardId: string;
}

export interface CardMovedMessage {
  type: 'CARD_MOVED';
  originTabId: string;
  cardId: string;
  fromColumnId: string;
  toColumnId: string;
  toIndex: number;
}

export interface DragStartMessage {
  type: 'DRAG_START';
  originTabId: string;
  cardId: string;
}

export interface DragEndMessage {
  type: 'DRAG_END';
  originTabId: string;
  cardId: string;
}

export interface ColumnRenamedMessage {
  type: 'COLUMN_RENAMED';
  originTabId: string;
  columnId: string;
  newName: string;
}

export interface BoardTitleChangedMessage {
  type: 'BOARD_TITLE_CHANGED';
  originTabId: string;
  title: string;
}

export interface TabJoinMessage {
  type: 'TAB_JOIN';
  originTabId: string;
}

export interface TabHeartbeatMessage {
  type: 'TAB_HEARTBEAT';
  originTabId: string;
}

export interface TabLeaveMessage {
  type: 'TAB_LEAVE';
  originTabId: string;
}

export interface ActivityLogAppendMessage {
  type: 'ACTIVITY_LOG_APPEND';
  originTabId: string;
  entry: ActivityLogEntry;
}

export type BroadcastMessage =
  | CardCreatedMessage
  | CardEditedMessage
  | CardDeletedMessage
  | CardMovedMessage
  | DragStartMessage
  | DragEndMessage
  | ColumnRenamedMessage
  | BoardTitleChangedMessage
  | TabJoinMessage
  | TabHeartbeatMessage
  | TabLeaveMessage
  | ActivityLogAppendMessage;
