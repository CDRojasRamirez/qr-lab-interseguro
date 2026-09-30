import { TestBed } from '@angular/core/testing';
import { Subject, of } from 'rxjs';
import { ApiHealthStore } from './api-health.store';
import { HealthApi, ServiceHealth } from './health.api';

const up: ServiceHealth = { name: 'Go API', status: 'ok', latencyMs: 5 };
const down: ServiceHealth = { name: 'Node API', status: 'down', latencyMs: null };

describe('ApiHealthStore', () => {
  const check = vi.fn();
  let store: ApiHealthStore;

  beforeEach(() => {
    check.mockReset();
    TestBed.configureTestingModule({ providers: [{ provide: HealthApi, useValue: { check } }] });
    store = TestBed.inject(ApiHealthStore);
  });

  it('starts empty and unknown', () => {
    expect(store.statuses()).toEqual([]);
    expect(store.allOk()).toBeNull();
    expect(check).not.toHaveBeenCalled();
  });

  it('flags loading while checking and stores the result', () => {
    const pending = new Subject<ServiceHealth[]>();
    check.mockReturnValue(pending);
    store.refresh();
    expect(store.loading()).toBe(true);
    pending.next([up]);
    pending.complete();
    expect(store.loading()).toBe(false);
    expect(store.statuses()).toEqual([up]);
    expect(store.allOk()).toBe(true);
  });

  it('reports not all ok when a service is down', () => {
    check.mockReturnValue(of([up, down]));
    store.refresh();
    expect(store.allOk()).toBe(false);
  });
});
