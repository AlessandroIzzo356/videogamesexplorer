import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading',
  standalone: true,
  templateUrl: './loading.html',
  styleUrl: './loading.css'
})
export class Loading {
  @Input() message = 'Caricamento...';
  @Input() variant: 'spinner' | 'cards' = 'spinner';
  @Input() count = 6;
}
