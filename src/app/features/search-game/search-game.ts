import { Component, DestroyRef, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, Subject, distinctUntilChanged, map, of, switchMap, catchError, tap } from 'rxjs';
import { RawgService } from '../../services/rawg.service';
import { GameCard } from '../../shared/game-card/game-card';
import { Loading } from '../../shared/loading/loading';
import { GameSuggestions } from '../../shared/game-suggestions/game-suggestions';
import { SearchInput } from '../../shared/search-input/search-input';
import { BacklogStatus, RawgGame, RawgGamesResponse } from '../../models/rawg';
import { BacklogService } from '../../services/backlog.service';

@Component({
  selector: 'app-search-game',
  standalone: true,
  imports: [GameCard, Loading, GameSuggestions, SearchInput],
  templateUrl: './search-game.html',
  styleUrl: './search-game.css'
})
export class SearchGame {
  private static readonly SUGGESTIONS_CACHE_LIMIT = 40;

  private rawg = inject(RawgService);
  private destroyRef = inject(DestroyRef);
  private backlogService = inject(BacklogService);
  private router = inject(Router);
  private suggestionQuery$ = new Subject<string>();
  private suggestionsCache = new Map<string, RawgGame[]>();

  query = signal('');
  results = signal<RawgGame[]>([]);
  suggestions = signal<RawgGame[]>([]);
  isLoading = signal(false);
  isSuggesting = signal(false);
  error = signal<string | null>(null);
  addedIds = signal(new Set<number>());
  statusById = signal(new Map<number, BacklogStatus>());

  constructor() {
    this.backlogService.backlog$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(games => {
        const nextIds = new Set<number>();
        const nextStatus = new Map<number, BacklogStatus>();
        games.forEach(game => {
          nextIds.add(game.id);
          if (game.backlogStatus) {
            nextStatus.set(game.id, game.backlogStatus);
          }
        });
        this.addedIds.set(nextIds);
        this.statusById.set(nextStatus);
      });
    this.suggestionQuery$
      .pipe(
        map(value => value.trim()),
        distinctUntilChanged(),
        switchMap(value => {
          if (value.length < 3) {
            this.isSuggesting.set(false);
            return of<RawgGamesResponse>({
              count: 0,
              next: null,
              previous: null,
              results: []
            });
          }

          const key = value.toLowerCase();
          const cached = this.suggestionsCache.get(key);
          if (cached) {
            this.isSuggesting.set(false);
            return of<RawgGamesResponse>({
              count: cached.length,
              next: null,
              previous: null,
              results: cached
            });
          }

          this.isSuggesting.set(true);
          return this.rawg.searchGames(value, 6).pipe(
            tap(response => {
              this.setCachedSuggestions(key, response.results ?? []);
            }),
            catchError(() => of<RawgGamesResponse>({ count: 0, next: null, previous: null, results: [] })),
            finalize(() => this.isSuggesting.set(false))
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(response => {
        this.suggestions.set(response.results ?? []);
      });
  }

  onQueryInput(value: string) {
    this.query.set(value);
  }

  onSuggestionQueryChange(value: string) {
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
          const results = response.results ?? [];
          this.results.set(results);
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

  onBacklogActionError(message: string) {
    this.error.set(message);
  }

  private setCachedSuggestions(key: string, results: RawgGame[]) {
    if (this.suggestionsCache.has(key)) {
      this.suggestionsCache.delete(key);
    }
    this.suggestionsCache.set(key, results);
    if (this.suggestionsCache.size <= SearchGame.SUGGESTIONS_CACHE_LIMIT) {
      return;
    }
    const oldestKey = this.suggestionsCache.keys().next().value;
    if (oldestKey) {
      this.suggestionsCache.delete(oldestKey);
    }
  }

  private getCachedSuggestions(query: string) {
    return this.suggestionsCache.get(query.toLowerCase());
  }
}
