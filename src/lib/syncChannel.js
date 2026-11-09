// Real-time cross-tab and in-memory synchronization channel for instant data updates

const AGENTS_CACHE_KEY = 'velki_agents_cache_v5';
const SETTINGS_CACHE_KEY = 'velki_site_settings_cache_v5';
const CHANNEL_NAME = 'velki_realtime_sync_channel';

let channel = null;

// Initialize BroadcastChannel if in browser
export function getSyncChannel() {
  if (typeof window === 'undefined') return null;
  if (!channel && 'BroadcastChannel' in window) {
    try {
      channel = new BroadcastChannel(CHANNEL_NAME);
    } catch (e) {
      console.warn('BroadcastChannel not supported or blocked:', e);
    }
  }
  return channel;
}

// Broadcast an event to all tabs and local window
export function broadcastSync(type, payload = {}) {
  if (typeof window === 'undefined') return;

  const message = { type, payload, timestamp: Date.now() };

  // 1. BroadcastChannel for other tabs/windows
  try {
    const ch = getSyncChannel();
    if (ch) {
      ch.postMessage(message);
    }
  } catch (e) {
    console.warn('BroadcastChannel error:', e);
  }

  // 2. CustomEvent for current window components
  try {
    window.dispatchEvent(new CustomEvent('velki_sync_event', { detail: message }));
  } catch (e) {}
}

// Subscribe to real-time events across all tabs & local window
export function subscribeSync(onMessage) {
  if (typeof window === 'undefined') return () => {};

  const handleCustomEvent = (event) => {
    if (event.detail) {
      onMessage(event.detail);
    }
  };

  const handleBroadcastMessage = (event) => {
    if (event.data) {
      onMessage(event.data);
    }
  };

  // Local window events
  window.addEventListener('velki_sync_event', handleCustomEvent);

  // Cross-tab events
  const ch = getSyncChannel();
  if (ch) {
    ch.addEventListener('message', handleBroadcastMessage);
  }

  // Fallback: storage event for browsers with limited BroadcastChannel
  const handleStorage = (e) => {
    if (e.key === AGENTS_CACHE_KEY || e.key === SETTINGS_CACHE_KEY) {
      onMessage({
        type: e.key === AGENTS_CACHE_KEY ? 'AGENTS_CACHE_MUTATED' : 'SETTINGS_CACHE_MUTATED',
        timestamp: Date.now()
      });
    }
  };
  window.addEventListener('storage', handleStorage);

  return () => {
    window.removeEventListener('velki_sync_event', handleCustomEvent);
    if (ch) {
      ch.removeEventListener('message', handleBroadcastMessage);
    }
    window.removeEventListener('storage', handleStorage);
  };
}

// Cached Agents Helpers
export function getCachedAgents() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AGENTS_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return null;
}

export function setCachedAgents(agents) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(AGENTS_CACHE_KEY, JSON.stringify(agents || []));
  } catch (e) {}
}

export function clearCachedAgents() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(AGENTS_CACHE_KEY);
  } catch (e) {}
}
