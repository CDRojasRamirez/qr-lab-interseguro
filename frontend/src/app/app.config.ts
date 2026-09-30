import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { LucideIconConfig } from 'lucide-angular';

import { routes } from './app.routes';
import { authInterceptor } from './core/auth/auth.interceptor';
import { loadAppConfig } from './core/config/app-config';

/** Icon defaults for the whole app (numbers, not strings: string inputs are parseInt'ed). */
const iconConfig = (): LucideIconConfig =>
  Object.assign(new LucideIconConfig(), { size: 16, strokeWidth: 1.8 });

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled' }),
    ),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAppInitializer(loadAppConfig),
    { provide: LucideIconConfig, useFactory: iconConfig },
  ],
};
