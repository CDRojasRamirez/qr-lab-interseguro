import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../shared/ui/icons';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss', './sidebar-desktop.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar {
  readonly collapsed = input(false);
  readonly mobileOpen = input(false);
  readonly user = input('admin');

  readonly toggleCollapse = output<void>();
  readonly closeMobile = output<void>();
  readonly logout = output<void>();

  protected readonly icons = ICONS;
}
