import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginHero } from './login-hero';

describe('LoginHero', () => {
  let fixture: ComponentFixture<LoginHero>;
  let el: HTMLElement;
  const pill = () => el.querySelector('.live')!;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [LoginHero] }).compileComponents();
    fixture = TestBed.createComponent(LoginHero);
    el = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('renders the pitch with the accent word and the stat strip', () => {
    expect(el.querySelector('h1')?.textContent).toContain('Cada rotación cuenta.');
    expect(el.querySelector('h1 .accent')?.textContent).toBe('rotación');
    const cells = [...el.querySelectorAll('.stat')].map((c) => c.textContent);
    expect(cells).toHaveLength(3);
    expect(cells[0]).toContain('Givens');
    expect(cells[1]).toContain('JWT RS256');
  });

  it('shows the live API state', async () => {
    expect(pill().textContent).toContain('Verificando APIs');
    fixture.componentRef.setInput('apisOnline', true);
    await fixture.whenStable();
    expect(pill().textContent).toContain('APIs en línea');
    expect(pill().classList).toContain('ok');
    fixture.componentRef.setInput('apisOnline', false);
    await fixture.whenStable();
    expect(pill().textContent).toContain('APIs sin conexión');
    expect(pill().classList).toContain('down');
  });
});
