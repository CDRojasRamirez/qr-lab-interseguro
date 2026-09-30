import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { APP_CONFIG_ERROR } from './core/config/app-config';
import { ThemeStore } from './core/theme/theme.store';
import { ICONS } from './shared/ui/icons';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LucideAngularModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly configError = inject(APP_CONFIG_ERROR);
  protected readonly icons = ICONS;

  constructor() {
    // Instantiated at the root so the persisted theme applies on every route, login included.
    inject(ThemeStore);
  }
}
