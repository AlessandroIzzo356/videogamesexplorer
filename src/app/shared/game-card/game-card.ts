import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RawgGame } from '../../models/rawg';
import { formatDate, platformIcons, stars } from '../utils';
import { BacklogActionsService } from '../../services/backlog-actions.service';
@Component({
  selector: 'app-game-card',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './game-card.html',
  styleUrl: './game-card.css'
})
export class GameCard {
  @Input({ required: true }) game!: RawgGame;
  @Input() showAdd = true;
  @Input() isAdded = false;
  @Input() showRemove = false;
  @Input() disableActions = false;
  @Input() useBacklogActions = false;
  @Output() addToBacklog = new EventEmitter<RawgGame>();
  @Output() removeFromBacklog = new EventEmitter<RawgGame>();
  @Output() actionError = new EventEmitter<string>();
  private backlogActions = inject(BacklogActionsService);
  protected readonly formatDate = formatDate;
  protected readonly stars = stars;
  protected readonly platformIcons = platformIcons;

  async handleAdd() {
    if (this.disableActions) {
      return;
    }
    if (!this.useBacklogActions) {
      this.addToBacklog.emit(this.game);
      return;
    }
    const result = await this.backlogActions.add(this.game);
    if (!result.ok) {
      this.actionError.emit(this.getErrorMessage(result.reason, 'add'));
    }
  }

  async handleRemove() {
    if (this.disableActions) {
      return;
    }
    if (!this.useBacklogActions) {
      this.removeFromBacklog.emit(this.game);
      return;
    }
    const result = await this.backlogActions.remove(this.game.id);
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
