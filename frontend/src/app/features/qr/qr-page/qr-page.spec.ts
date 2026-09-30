import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { ApiError } from '../../../core/http/api-error';
import { FactorizationApi } from '../data-access/factorization.api';
import { FactorizationResponse } from '../data-access/factorization.models';
import { HealthApi } from '../../../core/health/health.api';
import { MatrixInput } from '../matrix-input/matrix-input';
import { QrPage } from './qr-page';

const response: FactorizationResponse = {
  q: [[1, 0], [0, 1]],
  r: [[2, 1], [0, 3]],
  statistics: {
    global: { max: 3, min: 0, average: 1, sum: 8, count: 8 },
    perMatrix: [
      { name: 'Q', max: 1, min: 0, average: 0.5, sum: 2, count: 4, isDiagonal: true },
      { name: 'R', max: 3, min: 0, average: 1.5, sum: 6, count: 4, isDiagonal: false },
    ],
    anyDiagonal: true,
  },
};

describe('QrPage', () => {
  let fixture: ComponentFixture<QrPage>;
  let el: HTMLElement;
  const factorize = vi.fn();
  const check = vi.fn();

  const submit = async (matrix = [[1, 2], [3, 4]]) => {
    fixture.debugElement.query(By.directive(MatrixInput)).componentInstance.matrixSubmit.emit(matrix);
    await fixture.whenStable();
  };

  beforeEach(async () => {
    vi.resetAllMocks();
    check.mockReturnValue(of([{ name: 'Go API', status: 'ok', latencyMs: 7 }]));
    await TestBed.configureTestingModule({
      imports: [QrPage],
      providers: [
        { provide: FactorizationApi, useValue: { factorize } },
        { provide: HealthApi, useValue: { check } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(QrPage);
    el = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('renders the page header', () => {
    expect(el.querySelector('app-page-header h1')?.textContent).toContain('Factorización QR');
  });

  it('shows empty states before the first calculation', () => {
    expect(el.querySelectorAll('app-matrix-view .empty-state')).toHaveLength(2);
    expect(el.querySelector('app-stats-panel .empty-state')).toBeTruthy();
    expect(el.querySelector('app-stats-kpis .kpi-value')?.textContent).toContain('—');
  });

  it('checks API health on load and shows it in the status card', () => {
    expect(check).toHaveBeenCalledTimes(1);
    expect(el.querySelector('app-api-status')?.textContent).toContain('7 ms');
  });

  it('refreshes health on demand', async () => {
    el.querySelector<HTMLButtonElement>('app-api-status button')!.click();
    await fixture.whenStable();
    expect(check).toHaveBeenCalledTimes(2);
  });

  it('factorizes and renders Q, R, KPIs and the statistics table', async () => {
    factorize.mockReturnValue(of(response));
    await submit();
    expect(factorize).toHaveBeenCalledWith([[1, 2], [3, 4]]);
    const views = el.querySelectorAll('app-matrix-view');
    expect(views).toHaveLength(2);
    expect(views[0].textContent).toContain('Q · Ortogonal');
    expect(views[1].textContent).toContain('R · Triangular superior');
    expect(el.querySelectorAll('app-matrix-view table')).toHaveLength(2);
    expect(el.querySelectorAll('app-stats-panel tbody tr')).toHaveLength(2);
    expect(el.querySelector('app-stats-kpis .badge')?.textContent).toContain('Sí · Q');
  });

  it('shows the ApiError message, code and details, and no results', async () => {
    const error: ApiError = {
      status: 400,
      code: 'INVALID_MATRIX',
      message: 'La matriz no es válida.',
      details: ['row 2 has 3 columns'],
    };
    factorize.mockReturnValue(throwError(() => error));
    await submit();
    const alert = el.querySelector('.alert-error')!;
    expect(alert.textContent).toContain('La matriz no es válida.');
    expect(alert.querySelector('.error-code')?.textContent).toContain('INVALID_MATRIX');
    expect(alert.textContent).toContain('row 2 has 3 columns');
    expect(el.querySelector('app-stats-panel table')).toBeNull();
  });
});
