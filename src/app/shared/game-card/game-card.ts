import { Component, EventEmitter, Input, Output, inject, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { RouterLink } from '@angular/router';
import { BacklogStatus, RawgGame } from '../../models/rawg';
import { formatDate, platformIcons, stars } from '../utils';
import { BacklogActionsService } from '../../services/backlog-actions.service';
@Component({
  selector: 'app-game-card',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './game-card.html',
  styleUrl: './game-card.css'
})
export class GameCard implements OnChanges, OnDestroy {
  private static readonly menuEvents = new Subject<string | null>();
  @Input({ required: true }) game!: RawgGame;
  @Input() showAdd = true;
  @Input() isAdded = false;
  @Input() showRemove = false;
  @Input() disableActions = false;
  @Input() useBacklogActions = false;
  @Input() backlogStatus?: BacklogStatus;
  @Output() addToBacklog = new EventEmitter<RawgGame>();
  @Output() removeFromBacklog = new EventEmitter<RawgGame>();
  @Output() actionError = new EventEmitter<string>();
  private backlogActions = inject(BacklogActionsService);
  protected readonly formatDate = formatDate;
  protected readonly stars = stars;
  protected readonly platformIcons = platformIcons;
  isStatusMenuOpen = false;
  isStatusAnimating = false;
  private lastStatus: BacklogStatus | null = null;
  private menuSub: Subscription;

  constructor() {
    this.menuSub = GameCard.menuEvents.subscribe(openId => {
      if (!this.isStatusMenuOpen) {
        return;
      }
      if (openId !== this.menuKey()) {
        this.isStatusMenuOpen = false;
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['backlogStatus'] || changes['game']) {
      const current = this.resolvedStatus();
      if (current && this.lastStatus && current !== this.lastStatus) {
        this.triggerStatusFeedback();
      }
      this.lastStatus = current;
    }
  }

  ngOnDestroy() {
    this.menuSub?.unsubscribe();
  }

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

  toggleStatusMenu(event: Event) {
    event.stopPropagation();
    if (this.disableActions || !this.resolvedStatus()) {
      return;
    }
    const willOpen = !this.isStatusMenuOpen;
    this.isStatusMenuOpen = willOpen;
    if (willOpen) {
      GameCard.menuEvents.next(this.menuKey());
    }
  }

  async setStatus(status: BacklogStatus) {
    this.isStatusMenuOpen = false;
    if (this.disableActions || !this.game?.id) {
      return;
    }
    const previous = this.resolvedStatus();
    if (!this.useBacklogActions) {
      this.backlogStatus = status;
      return;
    }
    const result = await this.backlogActions.updateStatus(this.game.id, status);
    if (!result.ok) {
      this.actionError.emit(this.getErrorMessage(result.reason, 'status'));
      return;
    }
    this.backlogStatus = status;
    if (previous !== status) {
      if (status === 'in_progress') {
        this.backlogActions.playInProgressSound();
      } else if (status === 'completed') {
        this.backlogActions.playCompletedSound();
      } else if (status === 'to_play') {
        this.backlogActions.playToPlaySound();
      }
    }
    if (previous && previous !== status) {
      this.triggerStatusFeedback();
    }
  }

  handleDetailClick(event: Event) {
    if (this.isStatusMenuOpen) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  resolvedStatus() {
    return this.backlogStatus ?? this.game?.backlogStatus ?? null;
  }

  statusLabel(status: BacklogStatus) {
    if (status === 'in_progress') {
      return 'In corso';
    }
    if (status === 'completed') {
      return 'Completato';
    }
    return 'Da giocare';
  }

  private triggerStatusFeedback() {
    this.isStatusAnimating = true;
    setTimeout(() => {
      this.isStatusAnimating = false;
    }, 520);
  }

  private menuKey() {
    return String(this.game?.id ?? this.game?.name ?? '');
  }


  private getErrorMessage(reason: 'auth' | 'error', action: 'add' | 'remove' | 'status') {
    if (reason === 'auth') {
      return 'Non sei autenticato. Effettua il login.';
    }
    return action === 'add'
      ? 'Errore durante il salvataggio nel backlog.'
      : action === 'remove'
        ? 'Errore durante la rimozione dal backlog.'
        : 'Errore durante l\'aggiornamento dello stato.';
  }
}
