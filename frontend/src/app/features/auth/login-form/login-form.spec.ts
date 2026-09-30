import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginForm } from './login-form';

describe('LoginForm', () => {
  let fixture: ComponentFixture<LoginForm>;
  let el: HTMLElement;
  const emitted: unknown[] = [];

  const input = (id: string) => el.querySelector<HTMLInputElement>(`#${id}`)!;
  const type = (id: string, value: string) => {
    input(id).value = value;
    input(id).dispatchEvent(new Event('input'));
  };
  const submit = () => el.querySelector('form')!.dispatchEvent(new Event('submit'));

  beforeEach(async () => {
    emitted.length = 0;
    await TestBed.configureTestingModule({ imports: [LoginForm] }).compileComponents();
    fixture = TestBed.createComponent(LoginForm);
    fixture.componentInstance.credentials.subscribe((c) => emitted.push(c));
    el = fixture.nativeElement;
    await fixture.whenStable();
  });

  describe('demo credentials', () => {
    const demo = { username: 'admin', password: 'secret' };
    const block = () => el.querySelector('.demo');
    const fill = () => el.querySelector<HTMLButtonElement>('.demo button')!;
    const setDemo = async (value: typeof demo | null) => {
      fixture.componentRef.setInput('demoCredentials', value);
      await fixture.whenStable();
    };

    it('renders nothing when demoCredentials is null', () => {
      expect(block()).toBeNull();
      expect(el.textContent).not.toContain('Credenciales de prueba');
    });

    it('shows the label and values when provided', async () => {
      await setDemo(demo);
      expect(block()?.textContent).toContain('Credenciales de prueba');
      const values = Array.from(block()!.querySelectorAll('.num')).map((n) => n.textContent?.trim());
      expect(values).toEqual(['admin', 'secret']);
    });

    it('fills both controls, marks them dirty/touched, and does not submit', async () => {
      await setDemo(demo);
      expect(fill().type).toBe('button');
      fill().click();
      await fixture.whenStable();
      expect(input('username').value).toBe('admin');
      expect(input('password').value).toBe('secret');
      expect(emitted).toHaveLength(0);
      expect(el.querySelectorAll('.field-error')).toHaveLength(0);
      const fg = fixture.componentInstance['form'];
      expect(fg.controls.username.dirty && fg.controls.password.touched).toBe(true);
    });

    it('emits the filled values on submit', async () => {
      await setDemo(demo);
      fill().click();
      submit();
      expect(emitted).toEqual([demo]);
    });
  });

  it('does not render a hardcoded demo hint', () => {
    expect(el.textContent).not.toContain('admin / secret');
  });

  it('does not emit and shows required errors when empty', async () => {
    submit();
    await fixture.whenStable();
    expect(emitted).toHaveLength(0);
    expect(el.querySelectorAll('.field-error')).toHaveLength(2);
  });

  it('emits the credentials when valid', () => {
    type('username', 'admin');
    type('password', 'secret');
    submit();
    expect(emitted).toEqual([{ username: 'admin', password: 'secret' }]);
  });

  it('disables inputs and the button while loading', async () => {
    fixture.componentRef.setInput('loading', true);
    await fixture.whenStable();
    expect(input('username').disabled).toBe(true);
    expect(input('password').disabled).toBe(true);
    expect(el.querySelector<HTMLButtonElement>('button[type=submit]')!.disabled).toBe(true);
  });

  it('toggles password visibility from the eye button', async () => {
    const eye = () => el.querySelector<HTMLButtonElement>('.eye')!;
    expect(input('password').type).toBe('password');
    expect(eye().getAttribute('aria-label')).toBe('Mostrar contraseña');
    expect(eye().getAttribute('aria-pressed')).toBe('false');
    eye().click();
    await fixture.whenStable();
    expect(input('password').type).toBe('text');
    expect(eye().getAttribute('aria-label')).toBe('Ocultar contraseña');
    expect(eye().getAttribute('aria-pressed')).toBe('true');
    eye().click();
    await fixture.whenStable();
    expect(input('password').type).toBe('password');
  });

  it('does not submit when toggling the password', () => {
    type('username', 'admin');
    type('password', 'secret');
    el.querySelector<HTMLButtonElement>('.eye')!.click();
    expect(emitted).toHaveLength(0);
  });

  it('renders the error input', async () => {
    fixture.componentRef.setInput('error', 'Credenciales inválidas');
    await fixture.whenStable();
    expect(el.querySelector('[role=alert].alert')?.textContent).toContain('Credenciales inválidas');
  });
});
