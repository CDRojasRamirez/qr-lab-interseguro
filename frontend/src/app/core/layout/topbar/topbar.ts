import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ServiceHealth } from '../../health/health.api';
import { ICONS } from '../../../shared/ui/icons';
import { Theme } from '../../theme/theme.store';

@Component({
  selector: 'app-topbar',
  imports: [LucideAngularModule],
  templateUrl: './topbar.html',
  styleUrl: './topbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Topbar {
  readonly statuses = input<ServiceHealth[]>([]);
  readonly theme = input<Theme>('dark');
  readonly user = input('admin');
  readonly menuOpen = input(false);

  readonly toggleTheme = output<void>();
  readonly openMenu = output<void>();

  protected readonly icons = ICONS;

  protected shortName(name: string): string {
    return name.replace(/\s*API$/i, '');
  }
}
