import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, tap, throwError } from 'rxjs';
import { APP_CONFIG } from '../config/app-config';
import { toApiError } from '../http/api-error';

export const SESSION_KEY = 'qr.session';

export interface LoginResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}

interface Session {
  token: string;
  expiresAt: number;
}

function readSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<Session>) : null;
    if (
      typeof parsed?.token === 'string' &&
      typeof parsed.expiresAt === 'number' &&
      parsed.expiresAt > Date.now()
    ) {
      return { token: parsed.token, expiresAt: parsed.expiresAt };
    }
  } catch {
    // corrupt storage is treated as no session
  }
  sessionStorage.removeItem(SESSION_KEY);
  return null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);
  private readonly session = signal<Session | null>(readSession());

  readonly token = computed(() => this.session()?.token ?? null);
  readonly isAuthenticated = computed(() => this.token() !== null);

  login(username: string, password: string): Observable<void> {
    return this.http
      .post<LoginResponse>(`${this.config().goApiUrl}/api/v1/auth/login`, { username, password })
      .pipe(
        tap((res) => this.start(res)),
        map(() => undefined),
        catchError((err) => throwError(() => toApiError(err))),
      );
  }

  logout(): void {
    sessionStorage.removeItem(SESSION_KEY);
    this.session.set(null);
  }

  /** Signals do not tick with time, so expiry is re-checked on demand (guard). */
  hasValidSession(): boolean {
    const current = this.session();
    if (current && current.expiresAt <= Date.now()) {
      this.logout();
      return false;
    }
    return current !== null;
  }

  private start(res: LoginResponse): void {
    const session = { token: res.accessToken, expiresAt: Date.now() + res.expiresIn * 1000 };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    this.session.set(session);
  }
}
