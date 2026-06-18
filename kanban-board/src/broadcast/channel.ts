import type { BroadcastMessage } from '@/types';
import { BROADCAST_CHANNEL_NAME } from '@/utils/constants';

let channel: BroadcastChannel | null = null;

export function getChannel(): BroadcastChannel {
  if (typeof window === 'undefined') {
    throw new Error('BroadcastChannel is only available in the browser');
  }
  if (!channel) {
    channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  }
  return channel;
}

export function postMessage(msg: BroadcastMessage): void {
  try {
    getChannel().postMessage(msg);
  } catch {
    // Channel closed or unavailable — silently fail
  }
}

export function onMessage(
  handler: (msg: BroadcastMessage) => void
): () => void {
  const ch = getChannel();
  const listener = (event: MessageEvent<BroadcastMessage>) => {
    handler(event.data);
  };
  ch.addEventListener('message', listener);

  return () => {
    ch.removeEventListener('message', listener);
  };
}
