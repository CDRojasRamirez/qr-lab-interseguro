import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  template: `
    <header class="page-header">
      <div class="title-row">
        <span class="bar" aria-hidden="true"></span>
        <h1>{{ title() }}</h1>
      </div>
      @if (subtitle(); as text) {
        <p class="subtitle">{{ text }}</p>
      }
      <div class="divider" aria-hidden="true"></div>
    </header>
  `,
  styleUrl: './page-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeader {
  readonly title = input.required<string>();
  readonly subtitle = input<string | null>(null);
}
