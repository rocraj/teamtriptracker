import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface EmojiCategory {
  name: string;
  emojis: string[];
}

@Component({
  selector: 'app-emoji-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="emoji-picker bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-sm">
      <!-- Category Tabs -->
      <div class="flex gap-1 mb-3 border-b pb-2">
        <button
          type="button"
          *ngFor="let category of emojiCategories; let i = index"
          (click)="selectedCategoryIndex = i"
          [class]="'text-lg px-2 py-1 rounded transition-colors ' + 
            (selectedCategoryIndex === i ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100')">
          {{ category.emojis[0] }}
        </button>
      </div>
      
      <!-- Selected Category Name -->
      <div class="text-xs font-medium text-gray-600 mb-2 capitalize">
        {{ emojiCategories[selectedCategoryIndex].name }}
      </div>
      
      <!-- Emoji Grid -->
      <div class="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
        <button
          type="button"
          *ngFor="let emoji of emojiCategories[selectedCategoryIndex].emojis"
          (click)="selectEmoji(emoji)"
          [class]="'text-lg hover:scale-125 transition-transform p-1 rounded hover:bg-gray-100 ' +
            (selectedEmoji === emoji ? 'bg-blue-100 ring-2 ring-blue-300' : '')">
          {{ emoji }}
        </button>
      </div>
      
      <!-- Search -->
      <div class="mt-3 border-t pt-3">
        <input
          type="text"
          [(ngModel)]="searchTerm"
          (input)="onSearch()"
          placeholder="Search emojis..."
          class="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
      </div>
      
      <!-- Search Results -->
      <div *ngIf="searchResults.length > 0" class="mt-2">
        <div class="text-xs font-medium text-gray-600 mb-2">Search Results</div>
        <div class="grid grid-cols-8 gap-1 max-h-32 overflow-y-auto">
          <button
            type="button"
            *ngFor="let emoji of searchResults"
            (click)="selectEmoji(emoji)"
            [class]="'text-lg hover:scale-125 transition-transform p-1 rounded hover:bg-gray-100 ' +
              (selectedEmoji === emoji ? 'bg-blue-100 ring-2 ring-blue-300' : '')">
            {{ emoji }}
          </button>
        </div>
      </div>
      
      <!-- Actions -->
      <div class="flex justify-end gap-2 mt-3 pt-3 border-t">
        <button
          type="button"
          (click)="cancel.emit()"
          class="px-3 py-1 text-sm text-gray-600 hover:text-gray-800">
          Cancel
        </button>
        <button
          type="button"
          (click)="confirm()"
          [disabled]="!selectedEmoji"
          class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
          Select
        </button>
      </div>
    </div>
  `,
  styles: [`
    .emoji-picker {
      width: 320px;
      max-height: 400px;
    }
  `]
})
export class EmojiPickerComponent implements OnInit {
  @Input() currentEmoji?: string;
  @Output() emojiSelected = new EventEmitter<string>();
  @Output() cancel = new EventEmitter<void>();

  selectedEmoji: string = '';
  selectedCategoryIndex: number = 0;
  searchTerm: string = '';
  searchResults: string[] = [];

  emojiCategories: EmojiCategory[] = [
    {
      name: 'faces',
      emojis: [
        '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
        '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '☺️', '😚',
        '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭',
        '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄'
      ]
    },
    {
      name: 'activities',
      emojis: [
        '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱',
        '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳',
        '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸️',
        '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤼', '🤸', '⛹️', '🤺'
      ]
    },
    {
      name: 'food',
      emojis: [
        '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈',
        '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦',
        '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔',
        '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈'
      ]
    },
    {
      name: 'travel',
      emojis: [
        '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐',
        '🛻', '🚚', '🚛', '🚜', '🏍️', '🛵', '🚲', '🛴', '🛹', '🛼',
        '🚁', '✈️', '🛩️', '🛫', '🛬', '🪂', '💺', '🚀', '🛸', '🚊',
        '🚝', '🚅', '🚄', '🚈', '🚞', '🚋', '🚃', '🚂', '🚆', '🚇'
      ]
    },
    {
      name: 'objects',
      emojis: [
        '💰', '💴', '💵', '💶', '💷', '💸', '💳', '🧾', '💹', '💱',
        '💲', '🔨', '🪓', '⛏️', '🔧', '🔩', '⚙️', '🪛', '🔗', '⛓️',
        '📱', '📞', '☎️', '📟', '📠', '🔋', '🔌', '💻', '🖥️', '🖨️',
        '⌨️', '🖱️', '🖲️', '💽', '💾', '💿', '📀', '🧮', '🎥', '🎞️'
      ]
    },
    {
      name: 'nature',
      emojis: [
        '🌱', '🌿', '☘️', '🍀', '🎋', '🎍', '🌾', '🌵', '🌲', '🌳',
        '🌴', '🌸', '🌺', '🌻', '🌹', '🥀', '🌷', '💐', '🌼', '🌙',
        '⭐', '🌟', '✨', '⚡', '☄️', '💥', '🔥', '🌈', '☀️', '🌤️',
        '⛅', '🌥️', '☁️', '🌦️', '🌧️', '⛈️', '🌩️', '🌨️', '❄️', '☃️'
      ]
    },
    {
      name: 'symbols',
      emojis: [
        '❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '💔',
        '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️',
        '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐',
        '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐'
      ]
    }
  ];

  ngOnInit() {
    if (this.currentEmoji) {
      this.selectedEmoji = this.currentEmoji;
    }
  }

  selectEmoji(emoji: string) {
    this.selectedEmoji = emoji;
  }

  confirm() {
    if (this.selectedEmoji) {
      this.emojiSelected.emit(this.selectedEmoji);
    }
  }

  onSearch() {
    if (!this.searchTerm.trim()) {
      this.searchResults = [];
      return;
    }

    const searchLower = this.searchTerm.toLowerCase();
    this.searchResults = [];

    // Search through all categories
    this.emojiCategories.forEach(category => {
      // Simple search - could be enhanced with emoji names/keywords
      if (category.name.includes(searchLower)) {
        this.searchResults.push(...category.emojis.slice(0, 10));
      }
    });

    // Remove duplicates and limit results
    this.searchResults = [...new Set(this.searchResults)].slice(0, 32);
  }
}