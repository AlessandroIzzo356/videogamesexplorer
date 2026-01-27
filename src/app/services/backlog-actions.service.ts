import { Injectable, inject } from '@angular/core';
import { BacklogService } from './backlog.service';
import { RawgGame } from '../models/rawg';

export type BacklogActionResult = { ok: true } | { ok: false; reason: 'auth' | 'error' };

@Injectable({ providedIn: 'root' })
export class BacklogActionsService {
  private backlogService = inject(BacklogService);
  private addAudio = new Audio('/audio/add-game.mp3');
  private removeAudio = new Audio('/audio/remove-game.wav');

  constructor() {
    this.addAudio.volume = 1;
    this.removeAudio.volume = 0.5;
  }

  async add(game: RawgGame): Promise<BacklogActionResult> {
    try {
      await this.backlogService.addToBacklog(game);
      this.playAddSound();
      return { ok: true };
    } catch (error) {
      return { ok: false, reason: this.getReason(error) };
    }
  }

  async remove(gameId: number): Promise<BacklogActionResult> {
    try {
      await this.backlogService.removeFromBacklog(gameId);
      this.playRemoveSound();
      return { ok: true };
    } catch (error) {
      return { ok: false, reason: this.getReason(error) };
    }
  }

  private getReason(error: unknown): 'auth' | 'error' {
    if (error instanceof Error && error.message === 'User not authenticated') {
      return 'auth';
    }
    return 'error';
  }

  private playAddSound() {
    this.addAudio.currentTime = 0;
    void this.addAudio.play().catch(() => undefined);
  }

  private playRemoveSound() {
    this.removeAudio.currentTime = 0;
    void this.removeAudio.play().catch(() => undefined);
  }
}
