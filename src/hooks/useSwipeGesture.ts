import { useRef, useState, useCallback } from 'react';

interface SwipeConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  disabled?: boolean;
}

interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  isSwiping: boolean;
}

export function useSwipeGesture(config: SwipeConfig): SwipeHandlers {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    disabled = false,
  } = config;

  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);
  const [isSwiping, setIsSwiping] = useState(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    const touch = e.touches[0];
    touchStart.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
    setIsSwiping(false);
  }, [disabled]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (disabled || !touchStart.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStart.current.x;
    const dy = touch.clientY - touchStart.current.y;
    if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
      setIsSwiping(true);
    }
  }, [disabled, threshold]);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (disabled || !touchStart.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStart.current.x;
    const dy = touch.clientY - touchStart.current.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (absDx > threshold || absDy > threshold) {
      if (absDx > absDy) {
        // 水平滑动
        if (dx > 0 && onSwipeRight) onSwipeRight();
        else if (dx < 0 && onSwipeLeft) onSwipeLeft();
      } else {
        // 垂直滑动
        if (dy > 0 && onSwipeDown) onSwipeDown();
        else if (dy < 0 && onSwipeUp) onSwipeUp();
      }
    }

    touchStart.current = null;
    setIsSwiping(false);
  }, [disabled, threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  return { onTouchStart, onTouchMove, onTouchEnd, isSwiping };
}
