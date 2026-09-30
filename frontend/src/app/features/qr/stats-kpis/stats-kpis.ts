import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../shared/ui/icons';
import { Statistics } from '../data-access/factorization.models';

@Component({
  selector: 'app-stats-kpis',
  imports: [DecimalPipe, LucideAngularModule],
  templateUrl: './stats-kpis.html',
  styleUrl: './stats-kpis.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatsKpis {
  readonly stats = input<Statistics | null>(null);
  readonly loading = input(false);

  protected readonly icons = ICONS;

  protected readonly cards = computed(() => {
    const g = this.stats()?.global;
    return [
      { label: 'Máximo', value: g?.max ?? null, icon: ICONS.ArrowUp },
      { label: 'Mínimo', value: g?.min ?? null, icon: ICONS.ArrowDown },
      { label: 'Promedio', value: g?.average ?? null, icon: ICONS.Average },
      { label: 'Suma', value: g?.sum ?? null, icon: ICONS.Sigma },
      { label: 'Elementos', value: g?.count ?? null, icon: ICONS.Hash },
    ];
  });

  /** Names of the diagonal matrices, e.g. "Q"; empty when none are diagonal. */
  protected readonly diagonal = computed(() =>
    (this.stats()?.perMatrix ?? [])
      .filter((m) => m.isDiagonal)
      .map((m) => m.name)
      .join(', '),
  );
}
