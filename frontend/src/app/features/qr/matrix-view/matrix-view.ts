import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { LucideAngularModule, LucideIconData } from 'lucide-angular';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { ICONS } from '../../../shared/ui/icons';

@Component({
  selector: 'app-matrix-view',
  imports: [LucideAngularModule, EmptyState],
  templateUrl: './matrix-view.html',
  styleUrl: './matrix-view.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatrixView {
  readonly label = input.required<string>();
  readonly hint = input<string | null>(null);
  readonly icon = input<LucideIconData>(ICONS.Grid3x3);
  /** `null` renders the empty state (nothing calculated yet). */
  readonly matrix = input<number[][] | null>(null);

  protected readonly rows = computed(() => this.matrix()?.length ?? 0);
  protected readonly cols = computed(() => this.matrix()?.[0]?.length ?? 0);

  protected format(value: number): string {
    const text = value.toFixed(4);
    return text === '-0.0000' ? '0.0000' : text;
  }
}
