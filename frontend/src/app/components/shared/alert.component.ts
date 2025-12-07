import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-alert',
  template: `
    <div [class]="'px-4 py-3 rounded-lg border ' + alertClass" *ngIf="visible">
      {{ message }}
    </div>
  `,
  styles: [`
    @keyframes slideIn {
      from { transform: translateX(-100%); }
      to { transform: translateX(0); }
    }
    div {
      animation: slideIn 0.3s ease-out;
    }
  `]
})
export class AlertComponent {
  @Input() message: string = '';
  @Input() type: 'success' | 'error' | 'info' = 'info';
  @Input() visible: boolean = true;

  get alertClass(): string {
    const classes: { [key: string]: string } = {
      success: 'bg-green-50 border-green-200 text-green-700',
      error: 'bg-red-50 border-red-200 text-red-700',
      info: 'bg-blue-50 border-blue-200 text-blue-700'
    };
    return classes[this.type];
  }
}
