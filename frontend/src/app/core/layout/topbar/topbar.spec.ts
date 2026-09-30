import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ServiceHealth } from '../../health/health.api';
import { Topbar } from './topbar';

const statuses: ServiceHealth[] = [
  { name: 'Go API', status: 'ok', latencyMs: 9 },
  { name: 'Node API', status: 'down', latencyMs: null },
];

describe('Topbar', () => {
  let fixture: ComponentFixture<Topbar>;
  let el: HTMLElement;
  const events: string[] = [];
  const byLabel = (label: string) => el.querySelector<HTMLButtonElement>(`[aria-label="${label}"]`)!;

  beforeEach(async () => {
    events.length = 0;
    await TestBed.configureTestingModule({ imports: [Topbar] }).compileComponents();
    fixture = TestBed.createComponent(Topbar);
    fixture.componentInstance.toggleTheme.subscribe(() => events.push('theme'));
    fixture.componentInstance.openMenu.subscribe(() => events.push('menu'));
    fixture.componentRef.setInput('statuses', statuses);
    fixture.componentRef.setInput('user', 'maria');
    el = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('shows the breadcrumb and one pill per API', () => {
    expect(el.querySelector('.crumbs')?.textContent).toContain('Factorización');
    const pills = [...el.querySelectorAll('.api-pill')];
    expect(pills).toHaveLength(2);
    expect(pills[0].textContent).toContain('Go');
    expect(pills[0].textContent).toContain('9 ms');
    expect(pills[0].classList).toContain('ok');
    expect(pills[1].classList).toContain('down');
  });

  it('labels the theme toggle by the theme it switches to', async () => {
    expect(byLabel('Cambiar a tema claro')).toBeTruthy();
    fixture.componentRef.setInput('theme', 'light');
    await fixture.whenStable();
    expect(byLabel('Cambiar a tema oscuro')).toBeTruthy();
  });

  it('emits theme toggle and menu open', () => {
    byLabel('Cambiar a tema claro').click();
    byLabel('Abrir menú').click();
    expect(events).toEqual(['theme', 'menu']);
  });

  it('shows the user initial in the avatar', () => {
    expect(el.querySelector('.avatar')?.textContent?.trim()).toBe('M');
  });
});
