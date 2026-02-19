import '@testing-library/jest-dom';

// jsdom may not provide a fully functional localStorage.
// Provide a working polyfill that satisfies the Storage interface.
const createStorage = (): Storage => {
  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => { store[key] = String(value); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[key]); },
    get length() { return Object.keys(store).length; },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
};

// Force-set localStorage if it's missing or broken
try {
  // Test if localStorage works
  window.localStorage.getItem('__test__');
} catch {
  Object.defineProperty(window, 'localStorage', {
    value: createStorage(),
    writable: true,
  });
}

try {
  window.sessionStorage.getItem('__test__');
} catch {
  Object.defineProperty(window, 'sessionStorage', {
    value: createStorage(),
    writable: true,
  });
}
