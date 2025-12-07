import { Component, Input, Output, EventEmitter } from '@angular/core';
import { formatCurrency, getRelativeTime } from '../../utils/format';

@Component({
  selector: 'app-expense-card',
  template: `
    <div class="bg-white rounded-lg shadow-md p-4 sm:p-6 border-l-4" [style.borderLeftColor]="expense.type_emoji">
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <div class="flex items-center space-x-2 mb-2">
            <span class="text-2xl">{{ expense.type_emoji }}</span>
            <h4 class="text-lg font-semibold text-gray-900">{{ expense.type_label }}</h4>
          </div>
          <p class="text-sm text-gray-600">{{ expense.note }}</p>
          <p class="text-xs text-gray-500 mt-2">{{ getRelativeTime(expense.created_at) }}</p>
          <p class="text-xs text-gray-500">Paid by: {{ expense.payer_id }}</p>
        </div>
        <div class="text-right">
          <div class="flex items-center space-x-2 mb-2">
            <!-- Edit button for all team members -->
            <button 
              *ngIf="showEditButton"
              (click)="onEdit()"
              class="p-1 text-blue-600 hover:bg-blue-50 rounded-lg transition text-sm"
              title="Edit expense"
            >
              ✏️
            </button>
            <!-- Delete button only for expense owner or team creator -->
            <button 
              *ngIf="showDeleteButton"
              (click)="onDelete()"
              class="p-1 text-red-600 hover:bg-red-50 rounded-lg transition text-sm"
              title="Delete expense"
            >
              🗑️
            </button>
          </div>
          <p class="text-2xl font-bold text-gray-900">{{ '$' }}{{ expense.total_amount | number:'1.2-2' }}</p>
          <p class="text-xs text-gray-500">{{ expense.participants.length }} participants</p>
        </div>
      </div>
    </div>
  `
})
export class ExpenseCardComponent {
  @Input() expense: any;
  @Input() showEditButton: boolean = false;
  @Input() showDeleteButton: boolean = false;
  @Output() edit = new EventEmitter<any>();
  @Output() delete = new EventEmitter<any>();

  formatCurrency = formatCurrency;
  getRelativeTime = getRelativeTime;

  onEdit(): void {
    this.edit.emit(this.expense);
  }

  onDelete(): void {
    this.delete.emit(this.expense);
  }
}
