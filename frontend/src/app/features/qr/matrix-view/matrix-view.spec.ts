import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatrixView } from './matrix-view';

describe('MatrixView', () => {
  let fixture: ComponentFixture<MatrixView>;
  let el: HTMLElement;

  const render = async (matrix: number[][], label = 'Q (ortogonal)') => {
    fixture.componentRef.setInput('label', label);
    fixture.componentRef.setInput('matrix', matrix);
    await fixture.whenStable();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [MatrixView] }).compileComponents();
    fixture = TestBed.createComponent(MatrixView);
    el = fixture.nativeElement;
  });

  it('shows the label and dimensions', async () => {
    await render([[1, 2, 3], [4, 5, 6]]);
    expect(el.querySelector('h3')?.textContent).toContain('Q (ortogonal)');
    expect(el.querySelector('.chip')?.textContent).toContain('2×3');
  });

  it('formats every value with 4 decimals', async () => {
    await render([[1, 0.123456], [-2.5, 1 / 3]]);
    const values = [...el.querySelectorAll('td')].map((td) => td.textContent?.trim());
    expect(values).toEqual(['1.0000', '0.1235', '-2.5000', '0.3333']);
  });

  it('does not render negative zero', async () => {
    await render([[-0.00001, -0]]);
    const values = [...el.querySelectorAll('td')].map((td) => td.textContent?.trim());
    expect(values).toEqual(['0.0000', '0.0000']);
  });

  it('highlights only diagonal cells', async () => {
    await render([[1, 2, 3], [4, 5, 6]]);
    const cells = [...el.querySelectorAll('td')];
    const highlighted = cells.map((td, i) => td.classList.contains('diag') && i);
    expect(highlighted.filter((i) => i !== false)).toEqual([0, 4]);
  });

  it('shows an empty state without a matrix', async () => {
    fixture.componentRef.setInput('label', 'Q · Ortogonal');
    await fixture.whenStable();
    expect(el.querySelector('table')).toBeNull();
    expect(el.querySelector('.chip')).toBeNull();
    expect(el.querySelector('.empty-state')?.textContent).toContain('Carga una matriz y presiona Calcular');
  });

  it('exposes an accessible table label', async () => {
    await render([[1]], 'R (triangular superior)');
    expect(el.querySelector('table')?.getAttribute('aria-label')).toContain('R (triangular superior)');
  });
});
