import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';
import { APP_CONFIG } from '../config/app-config';

export interface ServiceHealth {
  name: string;
  status: 'ok' | 'down';
  latencyMs: number | null;
}

@Injectable({ providedIn: 'root' })
export class HealthApi {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);

  /** Never errors: a dead service is reported as `down`. */
  check(): Observable<ServiceHealth[]> {
    const { goApiUrl, nodeApiUrl } = this.config();
    return forkJoin([this.ping('Go API', goApiUrl), this.ping('Node API', nodeApiUrl)]);
  }

  private ping(name: string, baseUrl: string): Observable<ServiceHealth> {
    const start = performance.now();
    return this.http.get<{ status?: string }>(`${baseUrl}/health`).pipe(
      map((body): ServiceHealth =>
        body?.status === 'ok'
          ? { name, status: 'ok', latencyMs: Math.round(performance.now() - start) }
          : { name, status: 'down', latencyMs: null },
      ),
      catchError(() => of<ServiceHealth>({ name, status: 'down', latencyMs: null })),
    );
  }
}
