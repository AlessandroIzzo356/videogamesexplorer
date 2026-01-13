import { Component, DestroyRef, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, Subject, debounceTime, distinctUntilChanged, filter, map, of, switchMap, catchError, tap } from 'rxjs';
import { RawgService } from '../../services/rawg.service';
import { BacklogService } from '../../services/backlog.service';
import { GameCard } from '../../shared/game-card/game-card';
import { Loading } from '../../shared/loading/loading';
import { GameSuggestions } from '../../shared/game-suggestions/game-suggestions';
import { RawgGame, RawgGamesResponse } from '../../models/rawg';

@Component({
  selector: 'app-search-game',
  standalone: true,
  imports: [GameCard, Loading, GameSuggestions],
  templateUrl: './search-game.html',
  styleUrl: './search-game.css'
})
export class SearchGame {
  private rawg = inject(RawgService);
  private backlogService = inject(BacklogService);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);
  private suggestionQuery$ = new Subject<string>();
  private addAudio = new Audio('/audio/add-game.mp3');

  query = signal('');
  results = signal<RawgGame[]>([]);
  suggestions = signal<RawgGame[]>([]);
  isLoading = signal(false);
  isSuggesting = signal(false);
  error = signal<string | null>(null);
  addedIds = signal(new Set<number>());

  constructor() {
    this.addAudio.volume = 1;
    this.suggestionQuery$
      .pipe(
        debounceTime(300),
        map(value => value.trim()),
        distinctUntilChanged(),
        tap(value => {
          if (value.length < 3) {
            this.suggestions.set([]);
            this.isSuggesting.set(false);
          }
        }),
        filter(value => value.length >= 3),
        tap(() => {
          if (!this.suggestions().length) {
            this.isSuggesting.set(true);
          }
        }),
        switchMap(value =>
          this.rawg.searchGames(value, 6).pipe(
            catchError(() => of<RawgGamesResponse>({ count: 0, next: null, previous: null, results: [] })),
            finalize(() => this.isSuggesting.set(false))
          )
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(response => {
        this.suggestions.set(response.results ?? []);
      });
  }

  onQueryChange(value: string) {
    this.query.set(value);
    this.suggestionQuery$.next(value);
  }

  onSearch(event?: Event) {
    event?.preventDefault();
    const value = this.query().trim();
    if (!value) {
      this.results.set([]);
      this.suggestions.set([]);
      this.isSuggesting.set(false);
      return;
    }

    this.suggestions.set([]);
    this.isSuggesting.set(false);
    this.suggestionQuery$.next('');
    this.isLoading.set(true);
    this.error.set(null);

    this.rawg.searchGames(value)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (response: RawgGamesResponse) => {
          this.results.set(response.results ?? []);
        },
        error: () => {
          this.error.set('Errore durante la ricerca. Riprova tra poco.');
        }
      });
  }

  applySuggestion(game: RawgGame) {
    this.suggestions.set([]);
    this.router.navigate(['/game', game.id]);
  }

  async addToBacklog(game: RawgGame) {
    if (this.addedIds().has(game.id)) {
      return;
    }
    try {
      await this.backlogService.addToBacklog(game);
      this.addedIds.update(current => {
        const next = new Set(current);
        next.add(game.id);
        return next;
      });
      this.addAudio.currentTime = 0;
      void this.addAudio.play().catch(() => undefined);
    } catch {
      this.error.set('Non sei autenticato. Effettua il login.');
    }
  }

}
