import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-input-field',
  template: `
    <div class="mb-4">
      <label *ngIf="label" class="block text-sm font-medium text-gray-700 mb-2">
        {{ label }}
        <span *ngIf="required" class="text-red-500">*</span>
      </label>
      <input
        [type]="type"
        [value]="value"
        [placeholder]="placeholder"
        [disabled]="disabled"
        (input)="onChange($event)"
        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
      />
      <p *ngIf="error" class="mt-1 text-sm text-red-500">{{ error }}</p>
    </div>
  `
})
export class InputFieldComponent {
  @Input() type: string = 'text';
  @Input() label: string = '';
  @Input() placeholder: string = '';
  @Input() value: string = '';
  @Input() error: string = '';
  @Input() disabled: boolean = false;
  @Input() required: boolean = false;
  @Output() valueChange = new EventEmitter<string>();

  onChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.valueChange.emit(value);
  }
}
