import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

export type Theme = 'dark' | 'light';
export const THEME_KEY = 'qr-theme';

function readTheme(): Theme {
  try {
    return localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

/** UI-only preference: mirrors the theme onto <html data-theme> and persists it. */
@Injectable({ providedIn: 'root' })
export class ThemeStore {
  private readonly root = inject(DOCUMENT).documentElement;
  private readonly state = signal<Theme>(readTheme());

  readonly theme = this.state.asReadonly();

  constructor() {
    this.apply(this.state());
  }

  toggle(): void {
    const next: Theme = this.state() === 'dark' ? 'light' : 'dark';
    this.state.set(next);
    this.apply(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // storage may be blocked; the theme still applies for this visit
    }
  }

  private apply(theme: Theme): void {
    this.root.setAttribute('data-theme', theme);
  }
}
