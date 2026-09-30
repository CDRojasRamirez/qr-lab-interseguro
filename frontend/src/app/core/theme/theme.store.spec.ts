import { TestBed } from '@angular/core/testing';
import { THEME_KEY, ThemeStore } from './theme.store';

describe('ThemeStore', () => {
  const html = document.documentElement;
  const create = () => TestBed.inject(ThemeStore);

  beforeEach(() => {
    localStorage.clear();
    html.removeAttribute('data-theme');
  });

  it('defaults to dark and applies it to <html>', () => {
    const store = create();
    expect(store.theme()).toBe('dark');
    expect(html.getAttribute('data-theme')).toBe('dark');
  });

  it('restores a persisted theme', () => {
    localStorage.setItem(THEME_KEY, 'light');
    expect(create().theme()).toBe('light');
    expect(html.getAttribute('data-theme')).toBe('light');
  });

  it('ignores unknown persisted values', () => {
    localStorage.setItem(THEME_KEY, 'sepia');
    expect(create().theme()).toBe('dark');
  });

  it('toggles, applies and persists the theme', () => {
    const store = create();
    store.toggle();
    expect(store.theme()).toBe('light');
    expect(html.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem(THEME_KEY)).toBe('light');
    store.toggle();
    expect(store.theme()).toBe('dark');
    expect(localStorage.getItem(THEME_KEY)).toBe('dark');
  });
});
