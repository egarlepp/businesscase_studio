import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';

if (typeof window !== 'undefined') {
  const { cleanup } = await import('@testing-library/react');

  // Recharts' ResponsiveContainer needs ResizeObserver, which jsdom lacks.
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;

  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });
}
