import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ApiError } from '../../../core/http/api-error';
import { ICONS } from '../../../shared/ui/icons';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { ApiStatus } from '../api-status/api-status';
import { ApiHealthStore } from '../../../core/health/api-health.store';
import { FactorizationApi } from '../data-access/factorization.api';
import { FactorizationResponse, Matrix } from '../data-access/factorization.models';
import { MatrixInput } from '../matrix-input/matrix-input';
import { MatrixView } from '../matrix-view/matrix-view';
import { StatsKpis } from '../stats-kpis/stats-kpis';
import { StatsPanel } from '../stats-panel/stats-panel';

@Component({
  selector: 'app-qr-page',
  imports: [
    LucideAngularModule,
    PageHeader,
    MatrixInput,
    MatrixView,
    StatsKpis,
    StatsPanel,
    ApiStatus,
  ],
  templateUrl: './qr-page.html',
  styleUrl: './qr-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QrPage {
  private readonly factorizationApi = inject(FactorizationApi);
  private readonly health = inject(ApiHealthStore);

  protected readonly icons = ICONS;
  protected readonly result = signal<FactorizationResponse | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<ApiError | null>(null);
  protected readonly apiStatus = this.health.statuses;
  protected readonly statusLoading = this.health.loading;

  constructor() {
    this.refreshStatus();
  }

  protected factorize(matrix: Matrix): void {
    this.result.set(null);
    this.error.set(null);
    this.loading.set(true);
    this.factorizationApi.factorize(matrix).subscribe({
      next: (res) => {
        this.result.set(res);
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.error.set(err);
        this.loading.set(false);
      },
    });
  }

  protected refreshStatus(): void {
    this.health.refresh();
  }
}
