// 📁 src/utils/broadcastUtils.js
const CHANNEL_NAME = 'tms_state_sync';
let broadcastChannel = null;

/**
 * Inicjalizuje lub zwraca istniejący kanał BroadcastChannel.
 */
function getChannel() {
  if (!broadcastChannel) {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  }
  return broadcastChannel;
}

/**
 * Wysyła wiadomość do wszystkich zakładek — w zależności od typu.
 * @param {string} type - 'REFRESH_ALL' | 'REFRESH_VIEW'
 * @param {string} [view] - Opcjonalnie nazwa widoku, np. 'orders' lub 'runs'
 */
export function broadcastMessage(type, view = null) {
  const channel = getChannel();
  channel.postMessage(view ? { type, view } : { type });
}

/**
 * 🔄 Odświeża wszystkie dane (pełne reload API w każdej karcie)
 */
export function broadcastRefreshAll() {
  broadcastMessage('REFRESH_ALL');
}

/**
 * ♻️ Odświeża tylko dane konkretnego widoku, np. zamówienia lub kursy
 * @param {string} view - klucz zasobu (np. 'orders', 'assignments', 'runs')
 */
export function broadcastRefreshView(view) {
  if (!view) {
    console.warn('[broadcastRefreshView] View name is required');
    return;
  }
  broadcastMessage('REFRESH_VIEW', view);
}

/**
 * 🧹 Czyści połączenie z kanałem (opcjonalnie do wywołania przy unmount)
 */
export function closeBroadcastChannel() {
  if (broadcastChannel) {
    broadcastChannel.close();
    broadcastChannel = null;
  }
}