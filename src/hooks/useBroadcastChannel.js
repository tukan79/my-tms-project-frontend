import { useEffect, useCallback, useRef } from 'react';

/**
 * Reużywalny hook do komunikacji między zakładkami przeglądarki
 * (synchronizacja stanu, powiadomienia o zmianach, refresh danych, itp.)
 *
 * @param {string} channelName - Unikalna nazwa kanału, np. "assignments" lub "tms_state_sync"
 * @param {Object} [options]
 * @param {Function} [options.onMessage] - Callback wywoływany przy odbiorze wiadomości
 * @param {number} [options.debounceMs=0] - Opcjonalne opóźnienie w ms (chroni przed spamem)
 *
 * @returns {{
 *   postMessage: (message: any) => void,
 *   onMessage: (callback: (data: any) => void) => void,
 *   close: () => void
 * }}
 */
export const useBroadcastChannel = (channelName = 'tms_state_sync', options = {}) => {
  const { onMessage, debounceMs = 0 } = options;

  // Ref trzymający najnowszy callback
  const messageHandlerRef = useRef(onMessage);
  useEffect(() => {
    messageHandlerRef.current = onMessage;
  }, [onMessage]);

  // Używamy refa na kanał, by nie tworzyć go wielokrotnie
  const channelRef = useRef(null);
  if (!channelRef.current) {
    channelRef.current = new BroadcastChannel(channelName);
  }

  const debounceTimer = useRef(null);

  useEffect(() => {
    const handleMessage = (event) => {
      if (!messageHandlerRef.current) return;
      const data = event.data;

      if (debounceMs > 0) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
          messageHandlerRef.current?.(data);
        }, debounceMs);
      } else {
        messageHandlerRef.current?.(data);
      }
    };

    const channel = channelRef.current;
    channel.addEventListener('message', handleMessage);

    return () => {
      clearTimeout(debounceTimer.current);
      channel.removeEventListener('message', handleMessage);
    };
  }, [debounceMs]);

  /**
   * 📤 Wysyła wiadomość do wszystkich zakładek
   */
  const postMessage = useCallback((message) => {
    try {
      channelRef.current?.postMessage(message);
    } catch (err) {
      console.error('BroadcastChannel postMessage error:', err);
    }
  }, []);

  /**
   * 🧠 Pozwala dynamicznie podmienić callback odbioru wiadomości
   */
  const onMessageFn = useCallback((callback) => {
    messageHandlerRef.current = callback;
  }, []);

  /**
   * 🚪 Zamyka kanał — opcjonalnie np. przy unmountowaniu
   */
  const close = useCallback(() => {
    try {
      channelRef.current?.close();
    } catch (err) {
      console.warn('Error closing BroadcastChannel:', err);
    }
  }, []);

  return { postMessage, onMessage: onMessageFn, close };
};

// ostatnia zmiana (04.11.2025, 20:48:00)
