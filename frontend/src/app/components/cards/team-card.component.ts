import { Component, Input } from '@angular/core';
import { getAvatarColor, getInitials } from '../../utils/format';

@Component({
  selector: 'app-team-card',
  template: `
    <div class="bg-white rounded-lg shadow-md p-4 sm:p-6 cursor-pointer hover:shadow-lg transition" (click)="onSelect()">
      <div class="flex items-start justify-between mb-4">
        <div>
          <h3 class="text-lg font-semibold text-gray-900">{{ team.name }}</h3>
          <p class="text-sm text-gray-600 mt-1">{{ memberCount }} members</p>
        </div>
        <div class="text-3xl">{{ team.emoji || '👥' }}</div>
      </div>
      <div class="border-t pt-4">
        <p class="text-sm text-gray-700">
          <span class="font-medium">Balance:</span>
          <span [class]="balance >= 0 ? 'text-green-600' : 'text-red-600'">
            {{ balance >= 0 ? '+' : '' }}{{ '$' }}{{ Math.abs(balance) | number:'1.2-2' }}
          </span>
        </p>
      </div>
    </div>
  `,
  styles: [`
    div.cursor-pointer {
      cursor: pointer;
    }
  `]
})
export class TeamCardComponent {
  @Input() team: any;
  @Input() memberCount: number = 0;
  @Input() balance: number = 0;

  Math = Math;

  onSelect(): void {
    // Emit event or navigate
  }
}
