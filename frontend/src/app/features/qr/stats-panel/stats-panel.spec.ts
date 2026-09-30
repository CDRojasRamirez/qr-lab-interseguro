import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Statistics } from '../data-access/factorization.models';
import { StatsPanel } from './stats-panel';

const stats: Statistics = {
  global: { max: 3, min: -1.5, average: 1.23456, sum: 8, count: 8 },
  perMatrix: [
    { name: 'Q', max: 1, min: 0, average: 0.123456, sum: 2, count: 4, isDiagonal: true },
    { name: 'R', max: 3, min: 0, average: 1.5, sum: 6, count: 4, isDiagonal: false },
  ],
  anyDiagonal: true,
};

describe('StatsPanel', () => {
  let fixture: ComponentFixture<StatsPanel>;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [StatsPanel] }).compileComponents();
    fixture = TestBed.createComponent(StatsPanel);
    el = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('shows an empty state before the first calculation', () => {
    expect(el.querySelector('table')).toBeNull();
    expect(el.querySelector('.empty-state')?.textContent).toContain('Calcular');
  });

  it('renders one row per matrix with mono numbers and a diagonal badge', async () => {
    fixture.componentRef.setInput('stats', stats);
    await fixture.whenStable();
    const rows = [...el.querySelectorAll('tbody tr')];
    expect(rows).toHaveLength(2);
    expect(rows[0].textContent).toContain('Q');
    expect(rows[0].textContent).toContain('0.1235');
    expect(rows[0].querySelector('.badge')?.textContent).toContain('Sí');
    expect(rows[0].querySelector('.badge')?.classList).toContain('badge-success');
    expect(rows[1].querySelector('.badge')?.textContent).toContain('No');
    expect(rows[0].querySelectorAll('td.is-num')).toHaveLength(5);
  });

  it('labels the columns', async () => {
    fixture.componentRef.setInput('stats', stats);
    await fixture.whenStable();
    const heads = [...el.querySelectorAll('thead th')].map((th) => th.textContent?.trim());
    expect(heads).toEqual(['Matriz', 'Máx', 'Mín', 'Promedio', 'Suma', 'Elementos', 'Diagonal']);
  });
});
