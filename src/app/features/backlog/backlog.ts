import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BacklogService } from '../../services/backlog.service';
import { GameCard } from '../../shared/game-card/game-card';
import { moveItemInArray } from '@angular/cdk/drag-drop';
import { RawgGame } from '../../models/rawg';

@Component({
  selector: 'app-backlog',
  standalone: true,
  imports: [GameCard],
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

  constructor() {
    this.backlogService.backlog$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(games => {
        this.games.set(games);
        this.isLoading.set(false);
      });
  }

  async moveGame(index: number, direction: 'up' | 'down') {
    if (!this.reorderEnabled()) {
      return;
    }
    const current = this.games();
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
    const next = !this.reorderEnabled();
    this.reorderEnabled.set(next);
    if (!next) {
      void this.flushOrderSave();
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
