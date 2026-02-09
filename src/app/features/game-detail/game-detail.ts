import { Component, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RawgService } from '../../services/rawg.service';
import { RawgGameDetail } from '../../models/rawg';
import { formatDate, gameModes, genreNames, platformIcons } from '../../shared/utils';
import { companyNames, difficultyLabel, formatReason, ratingStars } from '../../shared/game-detail-utils';
import { BacklogService } from '../../services/backlog.service';
import { BacklogActionsService } from '../../services/backlog-actions.service';
import { AiInsightService } from '../../services/ai-insight.service';
import { AiInsight } from '../../models/ai-insight';

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
  private backlogService = inject(BacklogService);
  private backlogActions = inject(BacklogActionsService);
  private aiInsightService = inject(AiInsightService);

  isLoading = signal(false);
  error = signal<string | null>(null);
  aiError = signal<string | null>(null);
  game = signal<RawgGameDetail | null>(null);
  aiInsight = signal<AiInsight | null>(null);
  aiLoading = signal(false);
  seriesLoading = signal(false);
  franchise = signal<string | null>(null);
  isInBacklog = signal(false);
  private backlogIds = signal(new Set<number>());
  protected readonly formatDate = formatDate;
  protected readonly platformIcons = platformIcons;
  protected readonly genreNames = genreNames;
  protected readonly gameModes = gameModes;
  protected readonly difficultyLabel = difficultyLabel;
  protected readonly ratingStars = ratingStars;
  protected readonly companyNames = companyNames;
  protected readonly formatReason = formatReason;
  protected readonly resolveMode = this.getResolvedMode.bind(this);
  protected readonly resolveFranchise = this.getResolvedFranchise.bind(this);


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

    this.backlogService.backlog$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(games => {
        this.backlogIds.set(new Set(games.map(game => game.id)));
        this.updateBacklogState();
      });
  }

  async addToBacklog() {
    const game = this.game();
    if (!game || this.isInBacklog()) {
      return;
    }
    const result = await this.backlogActions.add(game);
    if (!result.ok) {
      this.error.set(result.reason === 'auth'
        ? 'Non sei autenticato. Effettua il login.'
        : 'Errore durante il salvataggio nel backlog.');
      return;
    }
    this.backlogIds.update(current => {
      const next = new Set(current);
      next.add(game.id);
      return next;
    });
    this.updateBacklogState();
  }

  async removeFromBacklog() {
    const game = this.game();
    if (!game || !this.isInBacklog()) {
      return;
    }
    const result = await this.backlogActions.remove(game.id);
    if (!result.ok) {
      this.error.set(result.reason === 'auth'
        ? 'Non sei autenticato. Effettua il login.'
        : 'Errore durante la rimozione dal backlog.');
      return;
    }
    this.backlogIds.update(current => {
      const next = new Set(current);
      next.delete(game.id);
      return next;
    });
    this.updateBacklogState();
  }

  private fetchGame(id: string) {
    this.isLoading.set(true);
    this.error.set(null);
    this.aiInsight.set(null);
    this.aiError.set(null);
    this.aiLoading.set(false);
    this.seriesLoading.set(false);
    this.franchise.set(null);

    this.rawg.getGameDetail(id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: game => {
          this.game.set(game);
          this.updateBacklogState();
          this.fetchSeriesAndAi(game);
        },
        error: () => this.error.set('Errore nel caricamento del dettaglio.')
      });
  }

  private updateBacklogState() {
    const currentId = this.game()?.id;
    if (!currentId) {
      this.isInBacklog.set(false);
      return;
    }
    this.isInBacklog.set(this.backlogIds().has(currentId));
  }

  private fetchAiInsight(game: RawgGameDetail, franchiseName?: string | null) {
    this.aiLoading.set(true);
    this.aiError.set(null);

    const payload = {
      gameId: game.id,
      gameName: game.name,
      name: game.name,
      released: game.released,
      genres: game.genres?.map(genre => genre.name) ?? [],
      platforms: game.platforms?.map(platform => platform.platform.name) ?? [],
      description: game.description_raw ?? '',
      modalita: gameModes(game),
      franchise: franchiseName ?? null
    };

    this.aiInsightService.getInsight(payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.aiLoading.set(false))
      )
      .subscribe({
        next: insight => this.aiInsight.set(insight),
        error: () => this.aiError.set('Errore nel caricamento del riepilogo AI.')
      });
  }

  private fetchSeriesAndAi(game: RawgGameDetail) {
    this.seriesLoading.set(true);
    this.rawg.getGameSeries(String(game.id), game.name)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.seriesLoading.set(false))
      )
      .subscribe({
        next: response => {
          this.franchise.set(response.franchise);
          this.fetchAiInsight(game, response.franchise);
        },
        error: () => {
          this.franchise.set(null);
          this.fetchAiInsight(game, null);
        }
      });
  }

  private getResolvedMode(game: RawgGameDetail, insight: AiInsight | null) {
    const sourceMode = gameModes(game);
    if (sourceMode !== 'N/D') {
      return sourceMode;
    }
    return insight?.modalita?.trim() || 'N/D';
  }

  private getResolvedFranchise(rawgFranchise: string | null, insight: AiInsight | null) {
    if (rawgFranchise?.trim()) {
      return rawgFranchise;
    }
    const aiFranchise = insight?.franchise?.trim();
    return aiFranchise && aiFranchise !== 'N/D' ? aiFranchise : null;
  }

}
