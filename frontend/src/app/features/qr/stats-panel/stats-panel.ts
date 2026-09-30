import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { ICONS } from '../../../shared/ui/icons';
import { Statistics } from '../data-access/factorization.models';

@Component({
  selector: 'app-stats-panel',
  imports: [DecimalPipe, LucideAngularModule, EmptyState],
  templateUrl: './stats-panel.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatsPanel {
  readonly stats = input<Statistics | null>(null);

  protected readonly icons = ICONS;
}
