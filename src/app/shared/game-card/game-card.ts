import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RawgGame } from '../../models/rawg';
import { formatDate, platformIcons, stars } from '../utils';
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
  @Output() addToBacklog = new EventEmitter<RawgGame>();
  @Output() removeFromBacklog = new EventEmitter<RawgGame>();
  protected readonly formatDate = formatDate;
  protected readonly stars = stars;
  protected readonly platformIcons = platformIcons;
}
