import { Component, Input } from '@angular/core';
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
        </div>
        <div class="text-right">
          <p class="text-2xl font-bold text-gray-900">{{ '$' }}{{ expense.total_amount | number:'1.2-2' }}</p>
          <p class="text-xs text-gray-500">{{ expense.participants.length }} participants</p>
        </div>
      </div>
    </div>
  `
})
export class ExpenseCardComponent {
  @Input() expense: any;

  formatCurrency = formatCurrency;
  getRelativeTime = getRelativeTime;
}
