import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'backlog' },
  {
    path: 'game/:id',
    loadComponent: () => import('./features/game-detail/game-detail').then(m => m.GameDetail),
    canMatch: [authGuard]
  },
  {
    path: 'backlog',
    loadComponent: () => import('./features/backlog/backlog').then(m => m.Backlog),
    canMatch: [authGuard]
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then(m => m.Login)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register').then(m => m.Register)
  },
  {
    path: 'search-game',
    loadComponent: () => import('./features/search-game/search-game').then(m => m.SearchGame),
    canMatch: [authGuard]
  },
  {
    path: 'tonight',
    loadComponent: () => import('./features/tonight/tonight').then(m => m.Tonight),
    canMatch: [authGuard]
  }
];
