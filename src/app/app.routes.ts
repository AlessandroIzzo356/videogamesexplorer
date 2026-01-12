import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'backlog' },
  {
    path: 'game/:id',
    loadComponent: () => import('./features/game-detail/game-detail').then(m => m.GameDetail)
  },
  {
    path: 'backlog',
    loadComponent: () => import('./features/backlog/backlog').then(m => m.Backlog)
  },
  {
    path: 'search-game',
    loadComponent: () => import('./features/search-game/search-game').then(m => m.SearchGame)
  },
  {
    path: 'tonight',
    loadComponent: () => import('./features/tonight/tonight').then(m => m.Tonight)
  }
];
