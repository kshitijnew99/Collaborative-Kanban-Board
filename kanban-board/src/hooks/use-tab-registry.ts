'use client';

import { useEffect, useRef, useCallback } from 'react';
import { onMessage, postMessage } from '@/broadcast/channel';
import { useBoardStore } from '@/store/board-store';
import type { TabRegistryEntry, BroadcastMessage } from '@/types';
import { HEARTBEAT_INTERVAL_MS, HEARTBEAT_TIMEOUT_MS } from '@/utils/constants';

/**
 * Manages the tab registry: join, heartbeat, pruning, and tab count.
 * Must be called once at the app root.
 */
export function useTabRegistry(): void {
  const tabId = useBoardStore((s) => s.tabId);

  // Mutable ref for the registry map so we avoid stale closures
  const registryRef = useRef<Map<string, TabRegistryEntry>>(new Map());
  const tabOrderRef = useRef<string[]>([]);

  const updateStoreRegistry = useCallback(() => {
    const entries = Array.from(registryRef.current.values());
    const { setTabRegistry, setTabLabel } = useBoardStore.getState();
    setTabRegistry(entries);

    // Compute tab label based on join order
    const myIndex = tabOrderRef.current.indexOf(tabId);
    if (myIndex >= 0) {
      setTabLabel(`Tab ${myIndex + 1}`);
    }
  }, [tabId]);

  const addTab = useCallback(
    (id: string) => {
      registryRef.current.set(id, { tabId: id, lastSeen: Date.now() });
      if (!tabOrderRef.current.includes(id)) {
        tabOrderRef.current.push(id);
      }
      updateStoreRegistry();
    },
    [updateStoreRegistry]
  );

  const removeTab = useCallback(
    (id: string) => {
      registryRef.current.delete(id);
      tabOrderRef.current = tabOrderRef.current.filter((t) => t !== id);
      updateStoreRegistry();
    },
    [updateStoreRegistry]
  );

  const pruneStale = useCallback(() => {
    const now = Date.now();
    let changed = false;
    registryRef.current.forEach((entry, id) => {
      if (id !== tabId && now - entry.lastSeen > HEARTBEAT_TIMEOUT_MS) {
        registryRef.current.delete(id);
        tabOrderRef.current = tabOrderRef.current.filter((t) => t !== id);
        changed = true;
      }
    });
    if (changed) {
      updateStoreRegistry();
    }
  }, [tabId, updateStoreRegistry]);

  useEffect(() => {
    // Register self
    addTab(tabId);

    // Announce join
    postMessage({ type: 'TAB_JOIN', originTabId: tabId });

    // Heartbeat interval
    const heartbeatTimer = setInterval(() => {
      // Update own lastSeen
      registryRef.current.set(tabId, { tabId, lastSeen: Date.now() });
      postMessage({ type: 'TAB_HEARTBEAT', originTabId: tabId });
    }, HEARTBEAT_INTERVAL_MS);

    // Prune interval
    const pruneTimer = setInterval(pruneStale, HEARTBEAT_INTERVAL_MS);

    // Listen for tab registry messages
    const cleanup = onMessage((msg: BroadcastMessage) => {
      if (msg.originTabId === tabId) return;

      switch (msg.type) {
        case 'TAB_JOIN':
          addTab(msg.originTabId);
          // Send our heartbeat back so the new tab knows about us
          postMessage({ type: 'TAB_HEARTBEAT', originTabId: tabId });
          break;

        case 'TAB_HEARTBEAT':
          addTab(msg.originTabId);
          break;

        case 'TAB_LEAVE':
          removeTab(msg.originTabId);
          break;

        default:
          // Non-registry messages — ignore here
          break;
      }
    });

    // Best-effort leave on unload
    const handleUnload = () => {
      postMessage({ type: 'TAB_LEAVE', originTabId: tabId });
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      clearInterval(heartbeatTimer);
      clearInterval(pruneTimer);
      cleanup();
      window.removeEventListener('beforeunload', handleUnload);
      handleUnload();
    };
  }, [tabId, addTab, removeTab, pruneStale]);
}
