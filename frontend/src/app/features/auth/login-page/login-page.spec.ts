import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { APP_CONFIG } from '../../../core/config/app-config';
import { AuthService } from '../../../core/auth/auth.service';
import { ApiError } from '../../../core/http/api-error';
import { ApiHealthStore } from '../../../core/health/api-health.store';
import { LoginForm } from '../login-form/login-form';
import { LoginPage } from './login-page';

describe('LoginPage', () => {
  let fixture: ComponentFixture<LoginPage>;
  let login: ReturnType<typeof vi.fn>;
  let navigate: ReturnType<typeof vi.fn>;
  const refresh = vi.fn();
  const allOk = signal<boolean | null>(true);

  const form = () => fixture.debugElement.query(By.directive(LoginForm)).componentInstance as LoginForm;
  const submit = async () => {
    form().credentials.emit({ username: 'admin', password: 'secret' });
    await fixture.whenStable();
  };

  beforeEach(async () => {
    login = vi.fn();
    navigate = vi.fn().mockResolvedValue(true);
    refresh.mockReset();
    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        { provide: AuthService, useValue: { login } },
        { provide: Router, useValue: { navigate } },
        { provide: ApiHealthStore, useValue: { refresh, allOk } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(LoginPage);
    await fixture.whenStable();
  });

  it('checks API health on load and shows it in the hero', () => {
    expect(refresh).toHaveBeenCalledTimes(1);
    const pill = fixture.nativeElement.querySelector('app-login-hero .live');
    expect(pill?.textContent).toContain('APIs en línea');
  });

  it('passes demoCredentials from APP_CONFIG to the form', async () => {
    expect(form().demoCredentials()).toBeNull();
    TestBed.inject(APP_CONFIG).set({
      goApiUrl: 'g',
      nodeApiUrl: 'n',
      demoCredentials: { username: 'admin', password: 'secret' },
    });
    await fixture.whenStable();
    expect(form().demoCredentials()).toEqual({ username: 'admin', password: 'secret' });
    expect(fixture.nativeElement.querySelector('.demo')?.textContent).toContain('secret');
  });

  it('logs in and navigates to /qr on success', async () => {
    login.mockReturnValue(of(undefined));
    await submit();
    expect(login).toHaveBeenCalledWith('admin', 'secret');
    expect(navigate).toHaveBeenCalledWith(['/qr']);
  });

  it('shows the ApiError message and stays on the page', async () => {
    const error: ApiError = { status: 401, code: 'UNAUTHORIZED', message: 'Credenciales inválidas', details: [] };
    login.mockReturnValue(throwError(() => error));
    await submit();
    expect(navigate).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('.alert')?.textContent).toContain('Credenciales inválidas');
  });

  it('flags loading while the request is in flight', async () => {
    const pending = new Subject<void>();
    login.mockReturnValue(pending);
    await submit();
    expect(fixture.nativeElement.querySelector('button[type=submit]').disabled).toBe(true);
    pending.next();
    pending.complete();
    await fixture.whenStable();
    expect(navigate).toHaveBeenCalledWith(['/qr']);
  });
});
