import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../shared/ui/icons';

export interface Credentials {
  username: string;
  password: string;
}

@Component({
  selector: 'app-login-form',
  imports: [ReactiveFormsModule, LucideAngularModule],
  templateUrl: './login-form.html',
  styleUrl: './login-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginForm {
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  readonly demoCredentials = input<Credentials | null>(null);
  readonly credentials = output<Credentials>();

  protected readonly icons = ICONS;
  protected readonly showPassword = signal(false);

  protected readonly form = new FormGroup({
    username: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  constructor() {
    effect(() => (this.loading() ? this.form.disable() : this.form.enable()));
  }

  protected togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  protected fillDemo(demo: Credentials): void {
    this.form.setValue(demo);
    Object.values(this.form.controls).forEach((c) => {
      c.markAsDirty();
      c.markAsTouched();
    });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.credentials.emit(this.form.getRawValue());
  }
}
