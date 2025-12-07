import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-button',
  template: `
    <button
      [disabled]="disabled"
      [class]="'px-4 py-2 rounded-lg font-medium transition text-sm ' + buttonClass"
      (click)="onClick()"
    >
      <span *ngIf="loading" class="inline-block mr-2">⟳</span>
      {{ label }}
    </button>
  `,
  styles: [`
    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `]
})
export class ButtonComponent {
  @Input() label: string = 'Button';
  @Input() type: 'primary' | 'secondary' | 'danger' = 'primary';
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;
  @Output() clicked = new EventEmitter<void>();

  get buttonClass(): string {
    const classes: { [key: string]: string } = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700',
      secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
      danger: 'bg-red-500 text-white hover:bg-red-600'
    };
    return classes[this.type];
  }

  onClick(): void {
    if (!this.disabled && !this.loading) {
      this.clicked.emit();
    }
  }
}
