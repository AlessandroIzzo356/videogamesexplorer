import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { RawgGame } from '../../models/rawg';
import { platformIcons, stars } from '../utils';
import { BacklogActionsService } from '../../services/backlog-actions.service';

@Component({
  selector: 'app-game-suggestions',
  standalone: true,
  templateUrl: './game-suggestions.html',
  styleUrl: './game-suggestions.css'
})
export class GameSuggestions {
  @Input() isLoading = false;
  @Input() suggestions: RawgGame[] = [];
  @Input() addedIds: Set<number> = new Set();
  @Input() useBacklogActions = false;
  @Output() select = new EventEmitter<RawgGame>();
  @Output() add = new EventEmitter<RawgGame>();
  @Output() remove = new EventEmitter<RawgGame>();
  @Output() actionError = new EventEmitter<string>();
  private backlogActions = inject(BacklogActionsService);

  protected readonly stars = stars;
  protected readonly platformIcons = platformIcons;

  isAdded(gameId: number) {
    return this.addedIds.has(gameId);
  }

  async handleAdd(game: RawgGame) {
    if (!this.useBacklogActions) {
      this.add.emit(game);
      return;
    }
    const result = await this.backlogActions.add(game);
    if (!result.ok) {
      this.actionError.emit(this.getErrorMessage(result.reason, 'add'));
    }
  }

  async handleRemove(game: RawgGame) {
    if (!this.useBacklogActions) {
      this.remove.emit(game);
      return;
    }
    const result = await this.backlogActions.remove(game.id);
    if (!result.ok) {
      this.actionError.emit(this.getErrorMessage(result.reason, 'remove'));
    }
  }

  private getErrorMessage(reason: 'auth' | 'error', action: 'add' | 'remove') {
    if (reason === 'auth') {
      return 'Non sei autenticato. Effettua il login.';
    }
    return action === 'add'
      ? 'Errore durante il salvataggio nel backlog.'
      : 'Errore durante la rimozione dal backlog.';
  }
}
