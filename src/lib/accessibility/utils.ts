/**
 * Accessibility utilities for WCAG compliance
 */

export interface A11yConfig {
  reducedMotion?: boolean;
  highContrast?: boolean;
  fontSize?: 'small' | 'medium' | 'large';
  announcements?: boolean;
}

// Focus management utilities
export class FocusManager {
  private static trapStack: HTMLElement[] = [];

  static trapFocus(element: HTMLElement): void {
    this.trapStack.push(element);
    this.setFocusTrap(element);
  }

  static releaseFocus(): void {
    const element = this.trapStack.pop();
    if (element) {
      this.removeFocusTrap(element);
    }
  }

  private static setFocusTrap(element: HTMLElement): void {
    const focusableElements = this.getFocusableElements(element);
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    element.addEventListener('keydown', handleTabKey);
    firstElement.focus();
  }

  private static removeFocusTrap(element: HTMLElement): void {
    element.removeEventListener('keydown', () => {});
  }

  static getFocusableElements(container: HTMLElement): HTMLElement[] {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');

    const elements = Array.from(
      container.querySelectorAll(focusableSelectors)
    ) as HTMLElement[];

    return elements.filter(element => {
      return !element.hasAttribute('aria-hidden') &&
             element.offsetWidth > 0 &&
             element.offsetHeight > 0;
    });
  }

  static moveFocusToElement(element: HTMLElement | null): void {
    if (element) {
      element.focus();
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
}

// Live region announcer
export class LiveAnnouncer {
  private static instance: LiveAnnouncer;
  private liveElement: HTMLElement | null = null;

  static getInstance(): LiveAnnouncer {
    if (!this.instance) {
      this.instance = new LiveAnnouncer();
    }
    return this.instance;
  }

  private constructor() {
    if (typeof window !== 'undefined') {
      this.createLiveElement();
    }
  }

  private createLiveElement(): void {
    this.liveElement = document.createElement('div');
    this.liveElement.setAttribute('aria-live', 'polite');
    this.liveElement.setAttribute('aria-atomic', 'true');
    this.liveElement.className = 'sr-only';
    document.body.appendChild(this.liveElement);
  }

  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.liveElement) return;

    this.liveElement.setAttribute('aria-live', priority);
    this.liveElement.textContent = message;

    // Clear the message after a brief delay to allow re-announcement of the same message
    setTimeout(() => {
      if (this.liveElement) {
        this.liveElement.textContent = '';
      }
    }, 1000);
  }
}

// Color contrast utilities
export function getContrastRatio(foreground: string, background: string): number {
  const fgLuminance = getLuminance(foreground);
  const bgLuminance = getLuminance(background);

  const lighter = Math.max(fgLuminance, bgLuminance);
  const darker = Math.min(fgLuminance, bgLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

export function getLuminance(color: string): number {
  const rgb = hexToRgb(color);
  if (!rgb) return 0;

  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

export function meetsWCAGStandard(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA',
  fontSize: 'normal' | 'large' = 'normal'
): boolean {
  const ratio = getContrastRatio(foreground, background);

  if (level === 'AAA') {
    return fontSize === 'large' ? ratio >= 4.5 : ratio >= 7;
  }

  return fontSize === 'large' ? ratio >= 3 : ratio >= 4.5;
}

// Keyboard navigation utilities
export const KEYBOARD_KEYS = {
  ESCAPE: 'Escape',
  ENTER: 'Enter',
  SPACE: ' ',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown'
} as const;

export function handleKeyboardNavigation(
  event: KeyboardEvent,
  items: HTMLElement[],
  currentIndex: number,
  options: {
    circular?: boolean;
    orientation?: 'horizontal' | 'vertical';
    onSelect?: (index: number) => void;
  } = {}
): number {
  const { circular = false, orientation = 'vertical', onSelect } = options;

  let newIndex = currentIndex;

  switch (event.key) {
    case KEYBOARD_KEYS.ARROW_DOWN:
      if (orientation === 'vertical') {
        event.preventDefault();
        newIndex = circular && currentIndex === items.length - 1
          ? 0
          : Math.min(currentIndex + 1, items.length - 1);
      }
      break;

    case KEYBOARD_KEYS.ARROW_UP:
      if (orientation === 'vertical') {
        event.preventDefault();
        newIndex = circular && currentIndex === 0
          ? items.length - 1
          : Math.max(currentIndex - 1, 0);
      }
      break;

    case KEYBOARD_KEYS.ARROW_RIGHT:
      if (orientation === 'horizontal') {
        event.preventDefault();
        newIndex = circular && currentIndex === items.length - 1
          ? 0
          : Math.min(currentIndex + 1, items.length - 1);
      }
      break;

    case KEYBOARD_KEYS.ARROW_LEFT:
      if (orientation === 'horizontal') {
        event.preventDefault();
        newIndex = circular && currentIndex === 0
          ? items.length - 1
          : Math.max(currentIndex - 1, 0);
      }
      break;

    case KEYBOARD_KEYS.HOME:
      event.preventDefault();
      newIndex = 0;
      break;

    case KEYBOARD_KEYS.END:
      event.preventDefault();
      newIndex = items.length - 1;
      break;

    case KEYBOARD_KEYS.ENTER:
    case KEYBOARD_KEYS.SPACE:
      event.preventDefault();
      if (onSelect) {
        onSelect(currentIndex);
      }
      return currentIndex;
  }

  if (newIndex !== currentIndex && items[newIndex]) {
    items[newIndex].focus();
  }

  return newIndex;
}

// Screen reader utilities
export function getScreenReaderText(text: string): string {
  // Remove emojis and special characters that might confuse screen readers
  return text
    .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu, '')
    .replace(/[^\w\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function generateAriaLabel(
  baseText: string,
  context?: {
    position?: { current: number; total: number };
    state?: string;
    instructions?: string;
  }
): string {
  let label = baseText;

  if (context?.position) {
    label += `, ${context.position.current} of ${context.position.total}`;
  }

  if (context?.state) {
    label += `, ${context.state}`;
  }

  if (context?.instructions) {
    label += `. ${context.instructions}`;
  }

  return getScreenReaderText(label);
}

// Motion preferences
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function setupMotionPreferences(): void {
  if (typeof window === 'undefined') return;

  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  const updateMotionPreference = () => {
    if (mediaQuery.matches) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
  };

  updateMotionPreference();
  mediaQuery.addEventListener('change', updateMotionPreference);
}

// High contrast support
export function setupHighContrastSupport(): void {
  if (typeof window === 'undefined') return;

  const mediaQuery = window.matchMedia('(prefers-contrast: high)');

  const updateContrastPreference = () => {
    if (mediaQuery.matches) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  };

  updateContrastPreference();
  mediaQuery.addEventListener('change', updateContrastPreference);
}

// Skip link utilities
export function createSkipLink(targetId: string, text: string): HTMLAnchorElement {
  const skipLink = document.createElement('a');
  skipLink.href = `#${targetId}`;
  skipLink.textContent = text;
  skipLink.className = 'skip-link sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-4 focus:bg-white focus:text-black focus:underline';

  skipLink.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.setAttribute('tabindex', '-1');
      target.focus();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  return skipLink;
}

// ARIA utilities
export function setAriaExpanded(element: HTMLElement, expanded: boolean): void {
  element.setAttribute('aria-expanded', expanded.toString());
}

export function setAriaSelected(element: HTMLElement, selected: boolean): void {
  element.setAttribute('aria-selected', selected.toString());
}

export function setAriaChecked(element: HTMLElement, checked: boolean | 'mixed'): void {
  element.setAttribute('aria-checked', checked.toString());
}

export function setAriaDisabled(element: HTMLElement, disabled: boolean): void {
  if (disabled) {
    element.setAttribute('aria-disabled', 'true');
  } else {
    element.removeAttribute('aria-disabled');
  }
}

// Form accessibility helpers
export function associateWithLabel(input: HTMLElement, labelText: string): void {
  const labelId = `label-${Math.random().toString(36).substr(2, 9)}`;

  let label = input.previousElementSibling as HTMLLabelElement;
  if (!label || label.tagName !== 'LABEL') {
    label = document.createElement('label');
    label.id = labelId;
    label.textContent = labelText;
    input.parentNode?.insertBefore(label, input);
  }

  input.setAttribute('aria-labelledby', labelId);
}

export function addErrorMessage(input: HTMLElement, errorMessage: string): void {
  const errorId = `error-${Math.random().toString(36).substr(2, 9)}`;

  let errorElement = input.nextElementSibling as HTMLElement;
  if (!errorElement || !errorElement.classList.contains('error-message')) {
    errorElement = document.createElement('div');
    errorElement.id = errorId;
    errorElement.className = 'error-message text-red-600 text-sm mt-1';
    errorElement.setAttribute('role', 'alert');
    input.parentNode?.insertBefore(errorElement, input.nextSibling);
  }

  errorElement.textContent = errorMessage;
  input.setAttribute('aria-describedby', errorId);
  input.setAttribute('aria-invalid', 'true');
}