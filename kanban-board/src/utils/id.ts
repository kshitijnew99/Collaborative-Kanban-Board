import { nanoid } from 'nanoid';

const TAB_ID_KEY = 'kanban-tab-id';

export function generateId(): string {
  return nanoid();
}

export function getTabId(): string {
  if (typeof window === 'undefined') return 'server';

  let tabId = sessionStorage.getItem(TAB_ID_KEY);
  if (!tabId) {
    tabId = nanoid(8);
    sessionStorage.setItem(TAB_ID_KEY, tabId);
  }
  return tabId;
}
