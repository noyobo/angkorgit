import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Hook for managing keyboard focus in list-style panels (filter input + list items).
 * Supports:
 * - Tab: moves from input to first item, then through items
 * - Shift+Tab: reverse
 * - Arrow keys: navigate items (updates activeIndex)
 * - Enter: activate focused/active item
 * - Escape: clear filter or close
 */
export function useListFocus<T>({
  items,
  open,
  onSelect,
  onClose,
}: {
  items: T[];
  open: boolean;
  onSelect: (item: T, index: number) => void;
  onClose?: () => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null!);

  // Reset when items or open state changes
  useEffect(() => {
    if (open) {
      setActiveIndex(0);
      setFocusedIndex(null);
    }
  }, [items.length, open]);

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.querySelector(`[data-list-index="${activeIndex}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(items.length - 1, i + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(0, i - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (items[activeIndex]) {
          onSelect(items[activeIndex], activeIndex);
        }
      } else if (e.key === 'Tab' && !e.shiftKey && items.length > 0) {
        e.preventDefault();
        setFocusedIndex(0);
        setActiveIndex(0);
        // Focus will be handled by the item with tabIndex={0}
        const firstItem = listRef.current?.querySelector(
          `[data-list-index="0"]`,
        ) as HTMLElement | null;
        firstItem?.focus();
      } else if (e.key === 'Escape') {
        if (e.currentTarget.value === '' && onClose) {
          e.preventDefault();
          onClose();
        }
      }
    },
    [items, activeIndex, onSelect, onClose],
  );

  const handleItemKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLElement>, index: number) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = Math.min(items.length - 1, index + 1);
        setActiveIndex(nextIndex);
        setFocusedIndex(nextIndex);
        const nextItem = listRef.current?.querySelector(
          `[data-list-index="${nextIndex}"]`,
        ) as HTMLElement | null;
        nextItem?.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = Math.max(0, index - 1);
        setActiveIndex(prevIndex);
        setFocusedIndex(prevIndex);
        const prevItem = listRef.current?.querySelector(
          `[data-list-index="${prevIndex}"]`,
        ) as HTMLElement | null;
        prevItem?.focus();
      } else if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        if (index < items.length - 1) {
          const nextIndex = index + 1;
          setFocusedIndex(nextIndex);
          setActiveIndex(nextIndex);
          const nextItem = listRef.current?.querySelector(
            `[data-list-index="${nextIndex}"]`,
          ) as HTMLElement | null;
          nextItem?.focus();
        }
      } else if (e.key === 'Tab' && e.shiftKey) {
        e.preventDefault();
        if (index > 0) {
          const prevIndex = index - 1;
          setFocusedIndex(prevIndex);
          setActiveIndex(prevIndex);
          const prevItem = listRef.current?.querySelector(
            `[data-list-index="${prevIndex}"]`,
          ) as HTMLElement | null;
          prevItem?.focus();
        } else {
          // Back to input
          setFocusedIndex(null);
          inputRef.current?.focus();
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (items[index]) {
          onSelect(items[index], index);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (onClose) onClose();
      }
    },
    [items, onSelect, onClose],
  );

  const getItemProps = useCallback(
    (index: number) => ({
      'data-list-index': index,
      tabIndex: focusedIndex === index ? 0 : -1,
      'aria-selected': activeIndex === index,
      onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => handleItemKeyDown(e, index),
      onFocus: () => {
        setFocusedIndex(index);
        setActiveIndex(index);
      },
      onMouseEnter: () => setActiveIndex(index),
    }),
    [focusedIndex, activeIndex, handleItemKeyDown],
  );

  return {
    inputRef,
    listRef,
    activeIndex,
    focusedIndex,
    handleInputKeyDown,
    getItemProps,
  };
}
