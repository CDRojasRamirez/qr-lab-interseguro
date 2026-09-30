import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { APP_CONFIG } from '../../../core/config/app-config';
import { AuthService } from '../../../core/auth/auth.service';
import { ApiError } from '../../../core/http/api-error';
import { ApiHealthStore } from '../../../core/health/api-health.store';
import { LoginHero } from '../login-hero/login-hero';
import { Credentials, LoginForm } from '../login-form/login-form';

@Component({
  selector: 'app-login-page',
  imports: [LoginForm, LoginHero],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly health = inject(ApiHealthStore);
  private readonly config = inject(APP_CONFIG);

  protected readonly demoCredentials = computed(() => this.config().demoCredentials ?? null);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly apisOnline = this.health.allOk;
  protected readonly year = new Date().getFullYear();

  constructor() {
    // /health is public and cheap: it drives the live pill in the hero.
    this.health.refresh();
  }

  protected login({ username, password }: Credentials): void {
    this.loading.set(true);
    this.error.set(null);
    this.auth.login(username, password).subscribe({
      next: () => {
        this.loading.set(false);
        void this.router.navigate(['/qr']);
      },
      error: (err: ApiError) => {
        this.loading.set(false);
        this.error.set(err.message);
      },
    });
  }
}
