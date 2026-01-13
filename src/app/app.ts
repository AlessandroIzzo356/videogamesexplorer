import { Component, DestroyRef, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Sidebar } from './layout/sidebar/sidebar';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Sidebar],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  protected readonly title = signal('VideoGamesExplorer');
  protected readonly showSidebar = signal(true);

  constructor() {
    this.showSidebar.set(!this.router.url.startsWith('/login') && !this.router.url.startsWith('/register'));
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.showSidebar.set(!this.router.url.startsWith('/login') && !this.router.url.startsWith('/register'));
      });
  }
}
