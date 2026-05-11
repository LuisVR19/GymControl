import { Routes } from '@angular/router';
import { MainLayoutComponent } from './core/layout/main-layout/main-layout.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'clients',
        loadComponent: () =>
          import('./features/clients/clients.component').then(m => m.ClientsComponent),
      },
      {
        path: 'routines',
        loadComponent: () =>
          import('./features/routines/routines.component').then(m => m.RoutinesComponent),
      },
      {
        path: 'exercises',
        loadComponent: () =>
          import('./features/exercises/exercises.component').then(m => m.ExercisesComponent),
      },
      {
        path: 'memberships',
        loadComponent: () =>
          import('./features/memberships/memberships.component').then(m => m.MembershipsComponent),
      },
      {
        path: 'payments',
        loadComponent: () =>
          import('./features/payments/payments.component').then(m => m.PaymentsComponent),
      },
      {
        path: 'gym',
        loadComponent: () =>
          import('./features/gym/gym.component').then(m => m.GymComponent),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
