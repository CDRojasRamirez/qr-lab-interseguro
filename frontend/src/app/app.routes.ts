import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Ingresar · QR Lab',
    loadComponent: () => import('./features/auth/login-page/login-page').then((m) => m.LoginPage),
  },
  {
    // Authenticated area: the shell (sidebar + topbar) wraps every child route.
    path: '',
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    loadComponent: () => import('./core/layout/app-shell/app-shell').then((m) => m.AppShell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'qr' },
      {
        path: 'qr',
        title: 'Factorización QR · QR Lab',
        loadComponent: () => import('./features/qr/qr-page/qr-page').then((m) => m.QrPage),
      },
    ],
  },
  { path: '**', redirectTo: 'qr' },
];
