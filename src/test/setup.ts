import '@testing-library/jest-dom';
import { jest } from '@jest/globals';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock window.ResizeObserver
class MockResizeObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

window.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

// Mock window.IntersectionObserver
class MockIntersectionObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

window.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

// Mock window.fetch
const mockFetch = jest.fn().mockImplementation(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    blob: () => Promise.resolve(new Blob()),
    text: () => Promise.resolve(''),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    formData: () => Promise.resolve(new FormData()),
    headers: new Headers(),
    status: 200,
    statusText: 'OK',
    type: 'basic',
    url: '',
    redirected: false,
    body: null,
    bodyUsed: false,
    clone: () => mockFetch(),
  } as Response)
);

(global as any).fetch = mockFetch;

// Mock window.URL.createObjectURL
window.URL.createObjectURL = jest.fn().mockReturnValue('mock-url') as unknown as (blob: Blob | MediaSource) => string;
window.URL.revokeObjectURL = jest.fn();

// Mock window.open
window.open = jest.fn().mockReturnValue(null) as unknown as typeof window.open;

// Mock document.createElement
const mockCreateElement = jest.fn().mockImplementation((tag: string) => {
  const element = document.createElement(tag);
  Object.assign(element, {
    click: jest.fn(),
    href: '',
    download: '',
    rel: '',
    remove: jest.fn(),
  });
  return element;
}) as unknown as typeof document.createElement;

document.createElement = mockCreateElement;

// Mock process.env
const originalEnv = process.env;
process.env = {
  ...originalEnv,
  NODE_ENV: 'test',
} as NodeJS.ProcessEnv;