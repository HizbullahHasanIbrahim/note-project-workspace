import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "area[href]",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "button:not([disabled])",
  "iframe",
  "object",
  "embed",
  "[contenteditable='true']",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

interface FocusTrapOptions {
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  returnFocusOnDeactivate?: boolean;
  onEscape?: () => void;
}

/**
 * Hook aksesibilitas focus-trap untuk modal dialog Material You (A11y / WAI-ARIA).
 * Mengunci navigasi Tab/Shift+Tab di dalam kontainer dialog dan mengembalikan fokus saat ditutup.
 */
export function useFocusTrap<T extends HTMLElement = HTMLElement>(
  active: boolean,
  options?: FocusTrapOptions
) {
  const containerRef = useRef<T | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;

    if (typeof document !== "undefined") {
      previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    }

    const container = containerRef.current;
    if (!container) return;

    const focusInitial = () => {
      if (options?.initialFocusRef?.current) {
        options.initialFocusRef.current.focus();
        return;
      }

      const focusable = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusable.length > 0) {
        focusable[0].focus();
      } else {
        container.focus();
      }
    };

    const timer = requestAnimationFrame(focusInitial);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && options?.onEscape) {
        e.preventDefault();
        e.stopPropagation();
        options.onEscape();
        return;
      }

      if (e.key !== "Tab") return;

      const focusable = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter((el) => el.offsetParent !== null || el.offsetWidth > 0 || el.offsetHeight > 0);

      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }

      const firstEl = focusable[0];
      const lastEl = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstEl || !container.contains(document.activeElement)) {
          e.preventDefault();
          lastEl.focus();
        }
      } else {
        if (document.activeElement === lastEl || !container.contains(document.activeElement)) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      cancelAnimationFrame(timer);
      document.removeEventListener("keydown", handleKeyDown);
      if (options?.returnFocusOnDeactivate !== false && previouslyFocusedRef.current) {
        previouslyFocusedRef.current.focus?.();
      }
    };
  }, [active, options]);

  return containerRef;
}
