import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';

@Component({
  selector: 'app-search-input',
  standalone: true,
  templateUrl: './search-input.html',
  styleUrl: './search-input.css'
})
export class SearchInput implements OnDestroy {
  @Input() value = '';
  @Input() placeholder = 'Cerca';
  @Input() ariaLabel = 'Campo di ricerca';
  @Input() variant: 'standalone' | 'embedded' = 'standalone';
  @Input() debounceMs = 0;
  @Output() valueChange = new EventEmitter<string>();
  @Output() debouncedValueChange = new EventEmitter<string>();
  private debounceTimer: number | undefined;

  onInput(event: Event) {
    const nextValue = (event.target as HTMLInputElement).value ?? '';
    this.valueChange.emit(nextValue);
    this.scheduleDebouncedEmit(nextValue);
  }

  ngOnDestroy() {
    if (this.debounceTimer) {
      window.clearTimeout(this.debounceTimer);
      this.debounceTimer = undefined;
    }
  }

  private scheduleDebouncedEmit(value: string) {
    if (this.debounceTimer) {
      window.clearTimeout(this.debounceTimer);
      this.debounceTimer = undefined;
    }
    if (this.debounceMs <= 0) {
      this.debouncedValueChange.emit(value);
      return;
    }
    this.debounceTimer = window.setTimeout(() => {
      this.debouncedValueChange.emit(value);
      this.debounceTimer = undefined;
    }, this.debounceMs);
  }
}
