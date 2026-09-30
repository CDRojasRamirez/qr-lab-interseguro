import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../shared/ui/icons';

@Component({
  selector: 'app-login-hero',
  imports: [LucideAngularModule],
  templateUrl: './login-hero.html',
  styleUrl: './login-hero.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginHero {
  /** `null` while the first health check is pending. */
  readonly apisOnline = input<boolean | null>(null);

  protected readonly icons = ICONS;
  protected readonly liveText = computed(() => {
    const online = this.apisOnline();
    if (online === null) return 'Verificando APIs…';
    return online ? 'APIs en línea' : 'APIs sin conexión';
  });

  protected readonly stats = [
    { key: 'Algoritmo', value: 'Givens', accent: true },
    { key: 'Seguridad', value: 'JWT RS256', accent: false },
    { key: 'Stack', value: 'Go + Node', accent: false },
  ];
}
