import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Statistics } from '../data-access/factorization.models';
import { StatsKpis } from './stats-kpis';

const stats = (qDiagonal: boolean): Statistics => ({
  global: { max: 3, min: -1.5, average: 1.23456, sum: 8, count: 8 },
  perMatrix: [
    { name: 'Q', max: 1, min: 0, average: 0.5, sum: 2, count: 4, isDiagonal: qDiagonal },
    { name: 'R', max: 3, min: 0, average: 1.5, sum: 6, count: 4, isDiagonal: false },
  ],
  anyDiagonal: qDiagonal,
});

describe('StatsKpis', () => {
  let fixture: ComponentFixture<StatsKpis>;
  let el: HTMLElement;
  const values = () => [...el.querySelectorAll('.kpi-value')].map((v) => v.textContent?.trim());
  const labels = () => [...el.querySelectorAll('.kpi-head')].map((v) => v.textContent?.trim());
  const set = async (name: string, value: unknown) => {
    fixture.componentRef.setInput(name, value);
    await fixture.whenStable();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [StatsKpis] }).compileComponents();
    fixture = TestBed.createComponent(StatsKpis);
    el = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('shows placeholders before the first calculation', () => {
    expect(labels()).toEqual(['Máximo', 'Mínimo', 'Promedio', 'Suma', 'Elementos', '¿Diagonal?']);
    expect(values().slice(0, 5)).toEqual(['—', '—', '—', '—', '—']);
    expect(el.querySelector('.badge')?.textContent).toContain('Sin datos');
  });

  it('shows skeletons while loading', async () => {
    await set('loading', true);
    expect(el.querySelectorAll('.skeleton')).toHaveLength(6);
  });

  it('renders the global statistics in mono', async () => {
    await set('stats', stats(true));
    expect(values().slice(0, 5)).toEqual(['3', '-1.5', '1.2346', '8', '8']);
    expect(el.querySelector('.kpi-value')?.classList).toContain('num');
  });

  it('names the diagonal matrices, or says none', async () => {
    await set('stats', stats(true));
    const badge = () => el.querySelector('.badge')!;
    expect(badge().textContent).toContain('Sí · Q');
    expect(badge().classList).toContain('badge-success');
    await set('stats', stats(false));
    expect(badge().textContent).toContain('Ninguna');
    expect(badge().classList).not.toContain('badge-success');
  });
});
