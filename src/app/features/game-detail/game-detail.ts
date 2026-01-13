import { Component, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RawgService } from '../../services/rawg.service';
import { RawgGameDetail } from '../../models/rawg';
import { formatDate, gameModes, genreNames, platformIcons } from '../../shared/utils';

@Component({
  selector: 'app-game-detail',
  standalone: true,
  templateUrl: './game-detail.html',
  styleUrl: './game-detail.css'
})
export class GameDetail {
  private route = inject(ActivatedRoute);
  private rawg = inject(RawgService);
  private destroyRef = inject(DestroyRef);

  isLoading = signal(false);
  error = signal<string | null>(null);
  game = signal<RawgGameDetail | null>(null);
  isDescriptionExpanded = signal(false);
  protected readonly formatDate = formatDate;
  protected readonly platformIcons = platformIcons;
  protected readonly genreNames = genreNames;
  protected readonly gameModes = gameModes;

  constructor() {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const id = params.get('id');
        if (!id) {
          this.error.set('ID gioco non valido.');
          return;
        }
        this.fetchGame(id);
      });
  }

  toggleDescription() {
    this.isDescriptionExpanded.update(value => !value);
  }

  private fetchGame(id: string) {
    this.isLoading.set(true);
    this.error.set(null);

    this.rawg.getGameDetail(id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: game => this.game.set(game),
        error: () => this.error.set('Errore nel caricamento del dettaglio.')
      });
  }

}
