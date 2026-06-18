# 📋 SyncBoard: Collaborative Kanban Board

A real-time collaborative, local-first Kanban board built for the **Infravox AI Frontend Internship Technical Assignment**. The application delivers a 100% client-side, zero-latency experience with modern styling and responsive cross-tab synchronization.

This repository is located at: [github.com/kshitijnew99/Collaborative-Kanban-Board](https://github.com/kshitijnew99/Collaborative-Kanban-Board)

---

## 🎥 Demo Video

Watch the **2-minute demo video** showing the Kanban board running in side-by-side tabs with live synchronization, drag-and-drop animations, activity logging, and the live tab registry count:

👉 **[SyncBoard Live Demo Video (Google Drive)](https://drive.google.com/file/d/15tjbsFj6aBRy9HbLcUp2lgylIIM16ZHU/view?usp=sharing)**

---

## 🚀 One-Command Setup

Because this project is built local-first and does not rely on any external databases or APIs, setting up and running it is incredibly simple. 

To download all packages and start the Next.js development server in one step, run the following command from the repository root:

```bash
cd kanban-board && npm install && npm run dev
```

### Setup Steps Breakdown:
1. **`cd kanban-board`**: Navigates into the application directory.
2. **`npm install`**: Downloads and installs all Node.js dependencies.
3. **`npm run dev`**: Starts the local development server.

After starting the server:
- Open **[http://localhost:3000](http://localhost:3000)** in your browser.
- Open a second tab side-by-side.
- Drag a card or edit content in one window, and watch the changes sync to the other window instantly!

---

## ✨ Key Features

- **Local-First & Zero Latency**: All changes are instantly updated in the local UI with no spinners or network-induced lags.
- **Multi-Tab Live Sync**: Built entirely around the native HTML5 **BroadcastChannel API** to sync cards, columns, due dates, comments, priorities, and board titles.
- **Visual Drag Indicators**: When a card is dragged in Tab A, it highlights dynamically in Tab B with a remote-drag style indicator (opacity reduction, border highlight, and ring glow).
- **Zustand State Management**: A clean, single-source-of-truth board store with action-origin tracking.
- **localStorage Persistence**: Board data and activity log are persisted locally, debounced at 250ms to ensure 60FPS animations.
- **Activity Log & Side Panel**: Floating panel to edit assignees, due dates (with red indicators when overdue), description, and comments, alongside a collapsible hoverable activity log sidebar.
- **Custom Components**: Clean Tailwind CSS styling and design inspired by premium UI/UX aesthetics—completely free of third-party widget frameworks like ShadCN or Material UI.

---

## 📡 BroadcastChannel Architecture

The synchronization layer uses the browser-native HTML5 `BroadcastChannel` API. The channel is utilized as a **transport layer**, whereas the Zustand store acts as the single source of truth in each tab.

### State Synchronization Flow

```
[User Interaction]
       │
       ▼
[Store Mutator Action] (origin: 'local')
       │
       ├─────────────────────────────────────┐
       ▼                                     ▼
[Local State Updates]                 [Post Message to BroadcastChannel]
(triggers UI render)                  (transports state mutations)
                                             │
                                             ▼
                                      [Other Active Tabs]
                                             │
                                             ▼
                                      [Message Handler]
                                             │
                                             ▼
                                      [Store Action] (origin: 'remote')
                                             │
                                             ▼
                                      [Local State Updates]
                                      (❌ NO RE-BROADCAST)
```

### Echo-Loop Prevention (Critical Implementation)

**The Echo Problem:** 
When Tab A updates its local store, it broadcasts the event. Tab B receives this event, applies it to its local store, which (if unchecked) triggers another broadcast back to Tab A. This causes a feedback loop that crashes the browser.

**The Multi-Layer Solution:**

1. **Origin Tagging (Primary mechanism)**: 
   Every board action (e.g. `editCard`, `moveCard`, `createCard`) accepts an `origin` parameter (`'local'` or `'remote'`). 
   - When the user performs an action on Tab A, it runs with `origin = 'local'`. The store updates state and checks `if (origin === 'local') { postMessage(...) }`.
   - When Tab B receives the message, it calls the corresponding action with `origin = 'remote'`. The action updates the local store but **bypasses the broadcast checks**, terminating the propagation.
2. **Tab ID Guard (Safety layer)**:
   On initialization, each tab generates a unique `tabId` (saved in `sessionStorage` to persist across refreshes). Every message sent contains the sender's `originTabId`. The receiver immediately runs a guard check:
   ```typescript
   if (msg.originTabId === tabId) return;
   ```
   This ensures that a tab will never consume its own echoed messages, providing defense-in-depth security for state sync.

---

## 🗃️ Tab Registry & Lifecycle

The app maintains a local tab registry to keep the active user/tab counter accurate:
- **Join**: Upon mounting, the tab broadcasts `TAB_JOIN`.
- **Heartbeat**: Every 5 seconds, each tab broadcasts `TAB_HEARTBEAT` to keep its session active.
- **Leave**: The tab listens for `beforeunload` events and broadcasts `TAB_LEAVE` as a best effort when closed.
- **Pruning**: Tabs maintain a registry list. Any tab that hasn't broadcast a heartbeat for over 15 seconds is pruned, gracefully handling browser crashes or force quits.

---

## 🛠️ Tech Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript (Strict Mode) |
| **Styling** | Tailwind CSS |
| **State Management** | Zustand |
| **Drag & Drop** | `@dnd-kit/core` & `@dnd-kit/sortable` |
| **Date Utilities** | `date-fns` |
| **Icons** | Lucide React |
| **Synchronization** | Native Browser BroadcastChannel API |
| **State Persistence** | LocalStorage with 250ms debounced saving |

---

## ⚠️ Known Limitations

1. **Same-Browser Only**: Because `BroadcastChannel` is restricted by the browser's Same-Origin Policy, real-time sync is limited to tabs open in the same browser on the same machine.
2. **Conflict Resolution (Last-Write-Wins)**: If two tabs edit the exact same card field simultaneously, the tab that saves last will overwrite the other's state. There is no CRDT (Conflict-Free Replicated Data Type) or Operational Transformation logic.
3. **Storage Limits**: Because all state is serialized into `localStorage`, the board is bound by the browser's default storage quota (typically ~5MB).
4. **Local Storage-Bound**: Without a server-side database, data cannot be synced across multiple devices or different browsers (e.g. Chrome to Firefox).
5. **No Undo/Redo**: Actions are immediate and permanent. Undoing a change is not natively supported (unless implemented via command history patterns).
