import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LucideAngularModule, LucideIconData } from 'lucide-angular';
import { ICONS } from '../icons';

@Component({
  selector: 'app-empty-state',
  imports: [LucideAngularModule],
  template: `
    <div class="empty-state">
      <span class="empty-icon"><lucide-icon [img]="icon()" [size]="20" /></span>
      <p class="empty-title">{{ title() }}</p>
      @if (hint(); as text) {
        <p class="empty-hint">{{ text }}</p>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyState {
  readonly title = input.required<string>();
  readonly hint = input<string | null>(null);
  readonly icon = input<LucideIconData>(ICONS.Grid3x3);
}
