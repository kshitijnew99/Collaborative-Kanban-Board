# Collaborative Kanban Board

A real-time collaborative Kanban board built with Next.js 14, TypeScript, and Zustand. Features multi-tab synchronization via the native BroadcastChannel API with robust echo-loop prevention.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. Open a second tab to see real-time synchronization.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS |
| State | Zustand (single centralized BoardStore) |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable |
| Persistence | localStorage (250ms debounced writes) |
| Cross-tab Sync | BroadcastChannel API (`'kanban-board'`) |

## Architecture

### State Flow

```
User Action → Store Action (origin: 'local') → State Update → Broadcast + Debounced Persist
                                                                    ↓
                                                          Other Tabs Receive
                                                                    ↓
                                              Store Action (origin: 'remote') → State Update
                                                                    ↓
                                                              ❌ NO Broadcast
```

### BroadcastChannel Design

The BroadcastChannel is **transport, not the source of truth**. It carries typed domain events between tabs. The Zustand store is the source of truth in each tab.

**Channel name:** `'kanban-board'` (hardcoded constant)

**Message types** (discriminated union `BroadcastMessage`):
- `CARD_CREATED` — full card object + column ID
- `CARD_EDITED` — card ID + partial updates
- `CARD_DELETED` — card ID
- `CARD_MOVED` — card ID + from/to column IDs + target index
- `DRAG_START` / `DRAG_END` — card ID (visual indicator in other tabs)
- `COLUMN_RENAMED` — column ID + new name
- `BOARD_TITLE_CHANGED` — new title
- `TAB_JOIN` / `TAB_HEARTBEAT` / `TAB_LEAVE` — tab registry coordination
- `ACTIVITY_LOG_APPEND` — activity log entry

Every message variant includes an `originTabId` field for identification.

### Echo-Loop Prevention (Critical Detail)

**Problem:** When Tab A broadcasts a state change, Tab B receives it and updates its state. If Tab B's state update triggers another broadcast, Tab A receives it back, creating an infinite loop.

**Solution — Two-layer protection:**

1. **Origin tagging (primary mechanism):** Every mutating store action accepts an `origin: ActionOrigin` parameter (`'local'` or `'remote'`). After applying state, the store only broadcasts if `origin === 'local'`. Remote-origin actions never broadcast. This is enforced at the store level, making it impossible for a received message to trigger a re-broadcast.

2. **Tab ID guard (safety layer):** The BroadcastChannel listener additionally checks `msg.originTabId !== myTabId` before processing any message. This provides defense-in-depth even if the origin-tagging mechanism were somehow bypassed.

**Why this works:** The origin tag is set at the call site. Local user actions call `store.createCard(columnId, title, 'local')` which updates state AND broadcasts. The broadcast listener calls `store.createCard(...)` with `'remote'`, which updates state but does NOT broadcast. The cycle is broken by design.

### Tab Registry

Each tab:
1. **Joins** on mount by sending `TAB_JOIN`
2. **Heartbeats** every 5 seconds via `TAB_HEARTBEAT`
3. **Leaves** on `beforeunload` (best-effort) via `TAB_LEAVE`

Other tabs maintain a `Map<tabId, lastSeen>` and **prune** entries not seen within 15 seconds. This handles crashes and force-closes that skip `beforeunload`.

The tab count indicator in the top bar reflects this live registry.

### localStorage Persistence

- **Hydration:** On mount, the Zustand store reads from `localStorage` to get the most recent board state (written by any tab). This is the only time localStorage is read.
- **Writes:** A debounced writer with exactly 250ms delay coalesces rapid changes (e.g., fast dragging) into single writes.
- **After hydration:** All state changes arrive via BroadcastChannel messages, not by re-polling localStorage.

## Project Structure

```
src/
├── app/
│   ├── globals.css            — Linear-inspired dark theme CSS
│   ├── layout.tsx             — Server component (metadata only)
│   └── page.tsx               — Client entry point
├── types.ts                   — All shared types + BroadcastMessage union
├── utils/
│   ├── id.ts                  — ID generation (nanoid) + tab ID
│   ├── time.ts                — Relative timestamps, overdue checks
│   └── constants.ts           — Constants, defaults, assignee list
├── persistence/
│   └── storage.ts             — localStorage read/write + 250ms debounce
├── broadcast/
│   └── channel.ts             — BroadcastChannel singleton wrapper
├── store/
│   └── board-store.ts         — Zustand store with origin-tagged actions
├── hooks/
│   ├── use-broadcast-sync.ts  — Message listener → store updates
│   └── use-tab-registry.ts    — Tab join/heartbeat/prune lifecycle
└── components/
    ├── KanbanApp.tsx           — Client root (wires hooks)
    ├── TopBar.tsx              — Title, search, filter, tab count
    ├── Board.tsx               — DndContext + columns layout
    ├── Column.tsx              — Header, cards, add-card control
    ├── Card.tsx                — Card display + draggable
    ├── EditPanel.tsx           — Right-side inline edit panel
    ├── ActivityLogSidebar.tsx  — Collapsible activity log
    └── ui/
        ├── Badge.tsx           — Priority badge (High/Medium/Low)
        ├── Button.tsx          — Button variants
        └── ConfirmPrompt.tsx   — Inline delete confirmation
```

## Design Decisions

### Concurrent Editing (Last-Write-Wins)
When two tabs edit the same card simultaneously, the last applied write wins. No merge or operational-transform logic is implemented. This is intentional: the complexity of conflict resolution is disproportionate to the value it provides in a client-only, same-browser application. In a production system with a backend, this would use server-side conflict resolution.

### Echo Prevention via Origin Tagging
Rather than maintaining a "recently sent message IDs" set and filtering echoes by ID, I chose origin tagging because it's simpler, has zero memory overhead, and prevents the echo at the source rather than filtering it after the fact. The origin is a parameter on every store action, making the flow explicit and easy to audit.

### Activity Log as Domain Events
Activity log entries are generated as first-class domain events at the action call site (e.g., "Card X moved from A to B"), not derived by diffing state snapshots. This makes them human-readable, precise, and cheap to produce. They're broadcast via a dedicated `ACTIVITY_LOG_APPEND` message type.

### Card Creation via Broadcast
When a remote `CARD_CREATED` message arrives, we apply the pre-built card object directly to the store (with its original ID) rather than re-calling `createCard` which would generate a new ID. This preserves card identity across tabs.

### DnD Library Choice
@dnd-kit/core + @dnd-kit/sortable is used for drag-and-drop because it's actively maintained, well-typed, and provides built-in sortable primitives with drop indicators. react-beautiful-dnd is explicitly forbidden (deprecated).

### Font Choice
Inter + JetBrains Mono from Google Fonts, as recommended by DESIGN.md as the closest free substitute for Linear's proprietary typeface.

### Store Architecture
A single Zustand store holds all shared board state. UI-only state (like "is this input focused" or "hover state") uses local React `useState` where appropriate. This prevents the store from becoming bloated with transient UI concerns while keeping all board data centralized.

## Known Limitations

- **Same-browser only:** BroadcastChannel is restricted to same-origin, same-browser. No cross-device or cross-browser sync.
- **No backend/auth:** All data lives in localStorage. No user authentication, no server persistence.
- **No conflict resolution:** Last-write-wins for concurrent edits. No OT/CRDT.
- **No undo:** Actions are not reversible. Could be added via a command pattern.
- **localStorage size limit:** ~5MB in most browsers. For very large boards, this could become a constraint.
- **Tab ID stability:** Tab IDs are stored in `sessionStorage` — they survive page refreshes within the same tab but are new for each new tab. They are not globally unique across browsers.

## Future Improvements

- Card color picker (5-option palette)
- Labels / tags on cards
- Dark mode toggle
- Keyboard shortcuts (Ctrl+N for new card, etc.)
- Undo/redo via command pattern
- Card archiving
- Drag handle vs click differentiation
