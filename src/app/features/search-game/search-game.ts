import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, Subject, debounceTime, distinctUntilChanged, filter, map, of, switchMap, catchError, tap } from 'rxjs';
import { RawgService } from '../../services/rawg.service';
import { GameCard } from '../../shared/game-card/game-card';
import { Loading } from '../../shared/loading/loading';
import { RawgGame, RawgGamesResponse } from '../../models/rawg';

@Component({
  selector: 'app-search-game',
  standalone: true,
  imports: [GameCard, Loading],
  templateUrl: './search-game.html',
  styleUrl: './search-game.css'
})
export class SearchGame {
  private rawg = inject(RawgService);
  private destroyRef = inject(DestroyRef);
  private suggestionQuery$ = new Subject<string>();

  query = signal('');
  results = signal<RawgGame[]>([]);
  suggestions = signal<RawgGame[]>([]);
  isLoading = signal(false);
  isSuggesting = signal(false);
  error = signal<string | null>(null);

  constructor() {
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
      return;
    }

    this.suggestions.set([]);
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
    this.query.set(game.name);
    this.suggestions.set([]);
    this.onSearch();
  }

  formatDate(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return new Intl.DateTimeFormat('it-IT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  }

}
