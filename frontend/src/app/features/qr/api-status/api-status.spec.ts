import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ServiceHealth } from '../../../core/health/health.api';
import { ApiStatus } from './api-status';

const statuses: ServiceHealth[] = [
  { name: 'Go API', status: 'ok', latencyMs: 12 },
  { name: 'Node API', status: 'down', latencyMs: null },
];

describe('ApiStatus', () => {
  let fixture: ComponentFixture<ApiStatus>;
  let el: HTMLElement;
  const button = () => el.querySelector<HTMLButtonElement>('button')!;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ApiStatus] }).compileComponents();
    fixture = TestBed.createComponent(ApiStatus);
    el = fixture.nativeElement;
    fixture.componentRef.setInput('statuses', statuses);
    await fixture.whenStable();
  });

  it('shows each service with state and latency', () => {
    const items = [...el.querySelectorAll('li')];
    expect(items).toHaveLength(2);
    expect(items[0].textContent).toContain('Go API');
    expect(items[0].textContent).toContain('En línea');
    expect(items[0].textContent).toContain('12 ms');
    expect(items[1].textContent).toContain('Caída');
    expect(items[1].querySelector('.badge-danger')).toBeTruthy();
    expect(items[0].querySelector('.badge-success')).toBeTruthy();
  });

  it('emits refresh on click', () => {
    let count = 0;
    fixture.componentInstance.refresh.subscribe(() => count++);
    button().click();
    expect(count).toBe(1);
  });

  it('disables the button while loading', async () => {
    fixture.componentRef.setInput('loading', true);
    await fixture.whenStable();
    expect(button().disabled).toBe(true);
    expect(button().textContent).toContain('Consultando');
  });

  it('shows a placeholder when nothing was checked yet', async () => {
    fixture.componentRef.setInput('statuses', []);
    await fixture.whenStable();
    expect(el.querySelectorAll('li')).toHaveLength(0);
    expect(el.textContent).toContain('Sin datos');
  });
});
