import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BacklogService } from '../../services/backlog.service';
import { GameCard } from '../../shared/game-card/game-card';
import { SearchInput } from '../../shared/search-input/search-input';
import { moveItemInArray } from '@angular/cdk/drag-drop';
import { BacklogStatus, RawgGame } from '../../models/rawg';

type BacklogFilterStatus = 'all' | BacklogStatus;

@Component({
  selector: 'app-backlog',
  standalone: true,
  imports: [GameCard, SearchInput],
  templateUrl: './backlog.html',
  styleUrl: './backlog.css'
})
export class Backlog {
  private backlogService = inject(BacklogService);
  private destroyRef = inject(DestroyRef);
  private moveTimer: number | undefined;
  private orderSaveTimer: number | undefined;
  private orderSaveBase: RawgGame[] | null = null;
  private readonly orderSaveWindowMs = 1500;

  games = signal<RawgGame[]>([]);
  isLoading = signal(true);
  reorderEnabled = signal(false);
  lastMovedId = signal<number | null>(null);
  searchQuery = signal('');
  statusFilter = signal<BacklogFilterStatus>('all');
  hasActiveFilters = computed(() => this.searchQuery().trim().length > 0 || this.statusFilter() !== 'all');
  canReorder = computed(() => this.games().length > 1 && !this.hasActiveFilters());
  filteredGames = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const status = this.statusFilter();
    return this.games().filter(game => {
      const statusMatch = status === 'all' ? true : (game.backlogStatus ?? 'to_play') === status;
      if (!statusMatch) {
        return false;
      }
      if (!query) {
        return true;
      }
      return game.name.toLowerCase().includes(query);
    });
  });

  constructor() {
    this.backlogService.backlog$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(games => {
        this.games.set(games);
        this.isLoading.set(false);
      });
  }

  async moveGame(gameId: number, direction: 'up' | 'down') {
    if (!this.reorderEnabled() || !this.canReorder()) {
      return;
    }
    const current = this.games();
    const index = current.findIndex(game => game.id === gameId);
    if (index === -1) {
      return;
    }
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= current.length) {
      return;
    }
    const updated = [...current];
    moveItemInArray(updated, index, targetIndex);
    this.games.set(updated);
    this.playMoveAnimation(updated[targetIndex]?.id);
    this.scheduleOrderSave(updated, current);
  }

  toggleReorder() {
    if (!this.canReorder()) {
      this.reorderEnabled.set(false);
      return;
    }
    const next = !this.reorderEnabled();
    this.reorderEnabled.set(next);
    if (!next) {
      void this.flushOrderSave();
    }
  }

  onSearchInput(value: string) {
    this.searchQuery.set(value);
    if (this.hasActiveFilters()) {
      this.reorderEnabled.set(false);
    }
  }

  setStatusFilter(status: BacklogFilterStatus) {
    this.statusFilter.set(status);
    if (this.hasActiveFilters()) {
      this.reorderEnabled.set(false);
    }
  }

  private playMoveAnimation(gameId?: number) {
    if (!gameId) {
      return;
    }
    this.lastMovedId.set(gameId);
    if (this.moveTimer) {
      window.clearTimeout(this.moveTimer);
    }
    this.moveTimer = window.setTimeout(() => {
      this.lastMovedId.set(null);
      this.moveTimer = undefined;
    }, 200);
  }

  private scheduleOrderSave(updated: RawgGame[], base: RawgGame[]) {
    if (!this.orderSaveBase) {
      this.orderSaveBase = [...base];
    }
    if (this.orderSaveTimer) {
      return;
    }
    this.orderSaveTimer = window.setTimeout(() => {
      void this.commitOrderSave(this.games());
    }, this.orderSaveWindowMs);
  }

  private async flushOrderSave() {
    if (this.orderSaveTimer) {
      window.clearTimeout(this.orderSaveTimer);
      this.orderSaveTimer = undefined;
    }
    await this.commitOrderSave(this.games());
  }

  private async commitOrderSave(games: RawgGame[]) {
    if (!games.length) {
      this.orderSaveBase = null;
      return;
    }
    try {
      await this.backlogService.updateOrder(games);
      this.orderSaveBase = null;
    } catch (error) {
      console.error('[backlog] update order failed', error);
      if (this.orderSaveBase) {
        this.games.set(this.orderSaveBase);
        this.orderSaveBase = null;
      }
    } finally {
      this.orderSaveTimer = undefined;
    }
  }
}
