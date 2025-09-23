'use client';

import { useEffect, useRef } from 'react';

interface LiveAnnouncerProps {
  message: string;
  priority?: 'polite' | 'assertive';
  clearDelay?: number;
}

export default function LiveAnnouncer({
  message,
  priority = 'polite',
  clearDelay = 1000
}: LiveAnnouncerProps) {
  const liveRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (liveRef.current && message) {
      liveRef.current.textContent = message;

      // Clear the message after delay to allow re-announcement
      const timer = setTimeout(() => {
        if (liveRef.current) {
          liveRef.current.textContent = '';
        }
      }, clearDelay);

      return () => clearTimeout(timer);
    }
  }, [message, clearDelay]);

  return (
    <div
      ref={liveRef}
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
      role="status"
    />
  );
}

// Hook for using live announcements
export function useLiveAnnouncer() {
  const liveRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Create live region if it doesn't exist
    if (!liveRef.current) {
      liveRef.current = document.createElement('div');
      liveRef.current.setAttribute('aria-live', 'polite');
      liveRef.current.setAttribute('aria-atomic', 'true');
      liveRef.current.setAttribute('role', 'status');
      liveRef.current.className = 'sr-only';
      document.body.appendChild(liveRef.current);
    }

    return () => {
      // Cleanup on unmount
      if (liveRef.current && liveRef.current.parentNode) {
        liveRef.current.parentNode.removeChild(liveRef.current);
      }
    };
  }, []);

  const announce = (
    message: string,
    priority: 'polite' | 'assertive' = 'polite'
  ) => {
    if (liveRef.current) {
      liveRef.current.setAttribute('aria-live', priority);
      liveRef.current.textContent = message;

      // Clear after delay
      setTimeout(() => {
        if (liveRef.current) {
          liveRef.current.textContent = '';
        }
      }, 1000);
    }
  };

  return { announce };
}