import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../shared/ui/icons';
import { ServiceHealth } from '../../../core/health/health.api';

@Component({
  selector: 'app-api-status',
  imports: [LucideAngularModule],
  templateUrl: './api-status.html',
  styleUrl: './api-status.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApiStatus {
  readonly statuses = input.required<ServiceHealth[]>();
  readonly loading = input(false);
  readonly refresh = output<void>();

  protected readonly icons = ICONS;
}
