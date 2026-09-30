import { Injectable, computed, inject, signal } from '@angular/core';
import { HealthApi, ServiceHealth } from './health.api';

/** Shared health snapshot so the topbar, the login hero and the status card agree. */
@Injectable({ providedIn: 'root' })
export class ApiHealthStore {
  private readonly api = inject(HealthApi);
  private readonly state = signal<ServiceHealth[]>([]);
  private readonly busy = signal(false);

  readonly statuses = this.state.asReadonly();
  readonly loading = this.busy.asReadonly();
  /** `null` until the first check completes. */
  readonly allOk = computed(() => {
    const list = this.state();
    return list.length === 0 ? null : list.every((s) => s.status === 'ok');
  });

  refresh(): void {
    this.busy.set(true);
    this.api.check().subscribe((statuses) => {
      this.state.set(statuses);
      this.busy.set(false);
    });
  }
}
