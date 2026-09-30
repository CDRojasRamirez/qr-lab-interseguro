import { HttpClient } from '@angular/common/http';
import { InjectionToken, WritableSignal, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export interface AppConfig {
  goApiUrl: string;
  nodeApiUrl: string;
  /** Public by design: shown on the login screen when the deployment opts in. */
  demoCredentials?: { username: string; password: string };
}

/** Runtime config (public/config.json), so one image serves any environment. */
export const APP_CONFIG = new InjectionToken<WritableSignal<AppConfig>>('APP_CONFIG', {
  providedIn: 'root',
  factory: () => signal<AppConfig>({ goApiUrl: '', nodeApiUrl: '' }),
});

/** Non-null when config.json could not be loaded; the shell shows it. */
export const APP_CONFIG_ERROR = new InjectionToken<WritableSignal<string | null>>(
  'APP_CONFIG_ERROR',
  { providedIn: 'root', factory: () => signal<string | null>(null) },
);

const isUrl = (value: unknown): value is string => typeof value === 'string' && value.length > 0;
const trimSlash = (url: string) => url.replace(/\/+$/, '');

/** Never rejects: a broken config must render an error, not a blank page. */
export async function loadAppConfig(): Promise<void> {
  const http = inject(HttpClient);
  const config = inject(APP_CONFIG);
  const error = inject(APP_CONFIG_ERROR);
  try {
    const raw = await firstValueFrom(http.get<Partial<AppConfig>>('config.json'));
    if (!isUrl(raw?.goApiUrl) || !isUrl(raw?.nodeApiUrl)) {
      throw new Error('invalid shape');
    }
    const demo = raw.demoCredentials;
    config.set({
      goApiUrl: trimSlash(raw.goApiUrl),
      nodeApiUrl: trimSlash(raw.nodeApiUrl),
      ...(isUrl(demo?.username) && isUrl(demo?.password)
        ? { demoCredentials: { username: demo.username, password: demo.password } }
        : {}),
    });
  } catch {
    error.set('No se pudo cargar una config.json válida (goApiUrl y nodeApiUrl son obligatorias).');
  }
}
