import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BacklogService } from '../../services/backlog.service';
import { GameCard } from '../../shared/game-card/game-card';
import { map, startWith } from 'rxjs';

@Component({
  selector: 'app-backlog',
  standalone: true,
  imports: [GameCard],
  templateUrl: './backlog.html',
  styleUrl: './backlog.css'
})
export class Backlog {
  private backlogService = inject(BacklogService);
  private removeAudio = new Audio('/audio/remove-game.wav');

  games = toSignal(this.backlogService.backlog$(), { initialValue: [] });
  isLoading = toSignal(this.backlogService.backlog$().pipe(
    map(() => false),
    startWith(true)
  ), { initialValue: true });

  constructor() {
    this.removeAudio.volume = 0.5;
  }

  async removeFromBacklog(gameId: number) {
    await this.backlogService.removeFromBacklog(gameId);
    this.removeAudio.currentTime = 0;
    void this.removeAudio.play().catch(() => undefined);
  }
}
