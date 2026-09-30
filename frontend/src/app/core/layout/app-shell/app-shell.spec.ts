import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { ApiHealthStore } from '../../health/api-health.store';
import { AuthService } from '../../auth/auth.service';
import { AppShell } from './app-shell';

const tokenFor = (sub: string) => `h.${btoa(JSON.stringify({ sub })).replace(/=+$/, '')}.s`;

describe('AppShell', () => {
  let fixture: ComponentFixture<AppShell>;
  let el: HTMLElement;
  const logout = vi.fn();
  const token = signal<string | null>(tokenFor('maria'));
  const byLabel = (label: string) => el.querySelector<HTMLButtonElement>(`[aria-label="${label}"]`)!;
  const shell = () => el.querySelector('.shell')!;

  beforeEach(async () => {
    logout.mockReset();
    localStorage.clear();
    token.set(tokenFor('maria'));
    await TestBed.configureTestingModule({
      imports: [AppShell],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { token, logout } },
        { provide: ApiHealthStore, useValue: { statuses: signal([]), loading: signal(false) } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(AppShell);
    el = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('renders sidebar, topbar and the outlet', () => {
    expect(el.querySelector('app-sidebar')).toBeTruthy();
    expect(el.querySelector('app-topbar')).toBeTruthy();
    expect(el.querySelector('main router-outlet')).toBeTruthy();
  });

  it('shows the token subject as the user, falling back to admin', async () => {
    expect(el.querySelector('app-sidebar .user')?.textContent).toContain('maria');
    token.set(null);
    await fixture.whenStable();
    expect(el.querySelector('app-sidebar .user')?.textContent).toContain('admin');
  });

  it('collapses and expands the sidebar', async () => {
    byLabel('Colapsar menú').click();
    await fixture.whenStable();
    expect(shell().classList).toContain('is-collapsed');
    byLabel('Expandir menú').click();
    await fixture.whenStable();
    expect(shell().classList).not.toContain('is-collapsed');
  });

  it('opens the mobile drawer and closes it from the backdrop', async () => {
    byLabel('Abrir menú').click();
    await fixture.whenStable();
    expect(shell().classList).toContain('is-open');
    el.querySelector<HTMLElement>('.backdrop')!.click();
    await fixture.whenStable();
    expect(shell().classList).not.toContain('is-open');
  });

  it('toggles the document theme', async () => {
    byLabel('Cambiar a tema claro').click();
    await fixture.whenStable();
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('logs out and goes to /login', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    [...el.querySelectorAll('button')].find((b) => b.textContent?.includes('Cerrar sesión'))!.click();
    expect(logout).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });
});
