import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { ApiHealthStore } from '../../health/api-health.store';
import { AuthService } from '../../auth/auth.service';
import { jwtSubject } from '../../auth/jwt-subject';
import { ThemeStore } from '../../theme/theme.store';
import { Sidebar } from '../sidebar/sidebar';
import { Topbar } from '../topbar/topbar';

/** Authenticated layout container: owns sidebar state, theme and logout. */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, Sidebar, Topbar],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'mobileOpen.set(false)' },
})
export class AppShell {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly themeStore = inject(ThemeStore);
  private readonly health = inject(ApiHealthStore);

  protected readonly collapsed = signal(false);
  protected readonly mobileOpen = signal(false);
  protected readonly theme = this.themeStore.theme;
  protected readonly statuses = this.health.statuses;
  protected readonly user = computed(() => jwtSubject(this.auth.token()) ?? 'admin');

  protected toggleCollapse(): void {
    this.collapsed.update((v) => !v);
  }

  protected toggleTheme(): void {
    this.themeStore.toggle();
  }

  protected logout(): void {
    this.mobileOpen.set(false);
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}
