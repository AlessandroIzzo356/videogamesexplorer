import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RawgGame } from '../../models/rawg';
import { platformIcons, stars } from '../utils';

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
  @Output() select = new EventEmitter<RawgGame>();
  @Output() add = new EventEmitter<RawgGame>();

  protected readonly stars = stars;
  protected readonly platformIcons = platformIcons;

  isAdded(gameId: number) {
    return this.addedIds.has(gameId);
  }
}
