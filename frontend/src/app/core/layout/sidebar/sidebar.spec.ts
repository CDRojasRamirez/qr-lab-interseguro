import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Sidebar } from './sidebar';

describe('Sidebar', () => {
  let fixture: ComponentFixture<Sidebar>;
  let el: HTMLElement;
  const events: string[] = [];
  const byLabel = (label: string) => el.querySelector<HTMLButtonElement>(`[aria-label="${label}"]`)!;

  beforeEach(async () => {
    events.length = 0;
    await TestBed.configureTestingModule({
      imports: [Sidebar],
      providers: [provideRouter([{ path: 'qr', children: [] }])],
    }).compileComponents();
    fixture = TestBed.createComponent(Sidebar);
    const c = fixture.componentInstance;
    c.toggleCollapse.subscribe(() => events.push('collapse'));
    c.closeMobile.subscribe(() => events.push('close'));
    c.logout.subscribe(() => events.push('logout'));
    fixture.componentRef.setInput('user', 'maria');
    el = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('renders the brand, nav items and the user', () => {
    expect(el.querySelector('.brand')?.textContent).toContain('QRLab');
    const links = [...el.querySelectorAll('nav a')].map((a) => a.textContent?.trim());
    expect(links).toEqual(['Factorización QR']);
    expect(el.querySelector('.user')?.textContent).toContain('maria');
  });

  it('marks the active route with aria-current', async () => {
    await TestBed.inject(Router).navigateByUrl('/qr');
    await fixture.whenStable();
    const qr = el.querySelector('nav a')!;
    expect(qr.getAttribute('aria-current')).toBe('page');
  });

  it('emits collapse from the edge button and reflects the state', async () => {
    byLabel('Colapsar menú').click();
    expect(events).toEqual(['collapse']);
    fixture.componentRef.setInput('collapsed', true);
    await fixture.whenStable();
    expect(el.querySelector('aside')?.classList).toContain('collapsed');
    expect(byLabel('Expandir menú').getAttribute('aria-expanded')).toBe('false');
  });

  it('emits close and logout', () => {
    byLabel('Cerrar menú').click();
    [...el.querySelectorAll('button')].find((b) => b.textContent?.includes('Cerrar sesión'))!.click();
    expect(events).toEqual(['close', 'logout']);
  });
});
