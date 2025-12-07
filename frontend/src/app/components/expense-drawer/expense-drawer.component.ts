import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TeamService } from '../../services/team.service';
import { ExpenseService } from '../../services/expense.service';
import { CategoryService, ExpenseCategory, TeamCustomCategory, TeamCategoriesResponse } from '../../services/category.service';
import { AuthService } from '../../services/auth.service';
import { Expense } from '../../models/index';
import { EmojiPickerComponent } from '../shared/emoji-picker.component';

interface TeamMemberWithUser {
  id: string;
  user_id: string;
  team_id: string;
  initial_budget: number;
  user: {
    id: string;
    email: string;
    name: string;
    photo_url?: string;
  };
}

interface ExpenseForm {
  description: string;
  amount: number | null;
  selectedCategory: {
    id: string;
    name: string;
    emoji: string;
    type: 'default' | 'team';
  } | null;
  splitType: 'equal' | 'selected';
  selectedParticipants: string[];
}

@Component({
  selector: 'app-expense-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule, EmojiPickerComponent],
  templateUrl: './expense-drawer.component.html',
  styleUrls: ['./expense-drawer.component.css']
})
export class ExpenseDrawerComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() teamId: string = '';
  @Input() expense: Expense | null = null; // null for add, expense object for edit
  @Output() close = new EventEmitter<void>();
  @Output() expenseCreated = new EventEmitter<Expense>();
  @Output() expenseUpdated = new EventEmitter<Expense>();
  
  teamMembers: TeamMemberWithUser[] = [];
  currentUserId: string = '';
  defaultCategories: ExpenseCategory[] = [];
  teamCustomCategories: TeamCustomCategory[] = [];
  additionalEmojis: string[] = [];
  isLoading = false;
  errorMessage = '';

  form: ExpenseForm = {
    description: '',
    amount: null,
    selectedCategory: null,
    splitType: 'equal',
    selectedParticipants: []
  };

  showEmojiPicker = false;
  showCustomCategory = false;
  customCategoryName = '';
  customCategoryEmoji = '💰';
  selectedCategoryValue = ''; // For dropdown binding

  get isEditMode(): boolean {
    return this.expense !== null;
  }

  get drawerTitle(): string {
    return this.isEditMode ? 'Edit Expense' : 'Add New Expense';
  }

  get submitButtonText(): string {
    return this.isEditMode ? 'Update Expense' : 'Add Expense';
  }

  constructor(
    private teamService: TeamService,
    private expenseService: ExpenseService,
    public categoryService: CategoryService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const currentUser = this.authService.getCurrentUser();
    this.currentUserId = currentUser?.id || '';
    this.loadCategories();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen'] && changes['isOpen'].currentValue && this.teamId) {
      this.loadTeamMembers();
      this.loadCategories();
      this.initializeForm();
    }
    if (changes['teamId'] && changes['teamId'].currentValue) {
      this.loadCategories();
    }
    if (changes['expense']) {
      this.initializeForm();
    }
  }

  initializeForm() {
    if (this.isEditMode && this.expense) {
      // Edit mode - populate form with existing expense data
      let selectedCategory = null;
      let dropdownValue = '';
      
      // Find the category from expense data
      if (this.expense.category) {
        selectedCategory = {
          id: this.expense.category.id,
          name: this.expense.category.name,
          emoji: this.expense.category.emoji,
          type: 'default' as const
        };
        dropdownValue = `default:${this.expense.category.id}`;
      } else if (this.expense.team_category) {
        selectedCategory = {
          id: this.expense.team_category.id,
          name: this.expense.team_category.name,
          emoji: this.expense.team_category.emoji,
          type: 'team' as const
        };
        dropdownValue = `team:${this.expense.team_category.id}`;
      }
      
      this.form = {
        description: this.expense.note || '',
        amount: this.expense.total_amount,
        selectedCategory,
        splitType: 'selected', // Always selected for existing expenses
        selectedParticipants: [...this.expense.participants]
      };
      this.selectedCategoryValue = dropdownValue;
    } else {
      // Add mode - reset to defaults
      this.resetForm();
    }
    this.errorMessage = '';
  }

  resetForm() {
    this.form = {
      description: '',
      amount: null,
      selectedCategory: null, // Will be set when categories are loaded
      splitType: 'equal',
      selectedParticipants: []
    };
    this.selectedCategoryValue = '';
    this.errorMessage = '';
    this.showEmojiPicker = false;
    this.showCustomCategory = false;
    this.customCategoryName = '';
    this.customCategoryEmoji = '💰';
  }

  loadTeamMembers() {
    this.isLoading = true;
    this.teamService.getMembers(this.teamId).subscribe({
      next: (members: any[]) => {
        this.teamMembers = members;
        // Initialize selected participants with all members for equal split (add mode only)
        if (!this.isEditMode && this.form.splitType === 'equal') {
          this.form.selectedParticipants = members.map((m: any) => m.user_id);
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading team members:', error);
        this.errorMessage = 'Failed to load team members';
        this.isLoading = false;
      }
    });
  }

  loadCategories() {
    this.categoryService.getTeamCategories(this.teamId).subscribe({
      next: (response: TeamCategoriesResponse) => {
        this.defaultCategories = response.default_categories.map(cat => ({
          ...cat,
          color: this.categoryService.getCategoryColor(cat.name)
        }));
        this.teamCustomCategories = response.team_categories;
        
        // Set default food category if no category is selected
        if (!this.form.selectedCategory && this.defaultCategories.length > 0) {
          const foodCategory = this.defaultCategories.find(cat => cat.name.toLowerCase() === 'food');
          if (foodCategory) {
            this.form.selectedCategory = {
              id: foodCategory.id,
              name: foodCategory.name,
              emoji: foodCategory.emoji,
              type: 'default'
            };
          }
        }
      },
      error: (error: any) => {
        console.error('Error loading categories:', error);
        this.errorMessage = 'Failed to load categories';
      }
    });
    
    this.additionalEmojis = this.categoryService.getAdditionalEmojis();
  }

  onCategoryChange(category: ExpenseCategory | TeamCustomCategory, type: 'default' | 'team') {
    this.form.selectedCategory = {
      id: category.id,
      name: category.name,
      emoji: category.emoji,
      type
    };
    this.selectedCategoryValue = `${type}:${category.id}`;
    this.showCustomCategory = false;
  }

  onCategoryDropdownChange(value: string) {
    if (value === 'custom') {
      this.showCustomCategory = true;
      this.form.selectedCategory = null;
      this.selectedCategoryValue = '';
      return;
    }

    const [type, id] = value.split(':');
    let category: ExpenseCategory | TeamCustomCategory | undefined;

    if (type === 'default') {
      category = this.defaultCategories.find(cat => cat.id === id);
      if (category) {
        this.onCategoryChange(category, 'default');
      }
    } else if (type === 'team') {
      category = this.teamCustomCategories.find(cat => cat.id === id);
      if (category) {
        this.onCategoryChange(category, 'team');
      }
    }
  }

  onEmojiSelect(emoji: string) {
    this.customCategoryEmoji = emoji;
    this.showEmojiPicker = false;
  }

  onEmojiSelected(emoji: string) {
    this.customCategoryEmoji = emoji;
    this.showEmojiPicker = false;
  }

  onSplitTypeChange() {
    if (this.form.splitType === 'equal') {
      // Select all members for equal split
      this.form.selectedParticipants = this.teamMembers.map(m => m.user_id);
    } else {
      // Clear selection for custom split (except in edit mode)
      if (!this.isEditMode) {
        this.form.selectedParticipants = [];
      }
    }
  }

  toggleParticipant(userId: string) {
    const index = this.form.selectedParticipants.indexOf(userId);
    if (index > -1) {
      this.form.selectedParticipants.splice(index, 1);
    } else {
      this.form.selectedParticipants.push(userId);
    }
  }

  isParticipantSelected(userId: string): boolean {
    return this.form.selectedParticipants.includes(userId);
  }

  createCustomCategory() {
    if (this.customCategoryName.trim()) {
      this.categoryService.createTeamCustomCategory(this.teamId, {
        name: this.customCategoryName.trim(),
        emoji: this.customCategoryEmoji
      }).subscribe({
        next: (newCategory: TeamCustomCategory) => {
          this.teamCustomCategories.push(newCategory);
          this.form.selectedCategory = {
            id: newCategory.id,
            name: newCategory.name,
            emoji: newCategory.emoji,
            type: 'team'
          };
          this.selectedCategoryValue = `team:${newCategory.id}`;
          this.customCategoryName = '';
          this.showCustomCategory = false;
          this.showEmojiPicker = false;
        },
        error: (error: any) => {
          console.error('Error creating custom category:', error);
          this.errorMessage = 'Failed to create custom category';
        }
      });
    }
  }

  deleteCustomCategory(categoryId: string) {
    this.categoryService.deleteTeamCustomCategory(this.teamId, categoryId).subscribe({
      next: () => {
        this.teamCustomCategories = this.teamCustomCategories.filter(cat => cat.id !== categoryId);
        // If the deleted category was selected, clear the selection
        if (this.form.selectedCategory?.id === categoryId) {
          this.form.selectedCategory = null;
        }
      },
      error: (error: any) => {
        console.error('Error deleting custom category:', error);
        this.errorMessage = 'Failed to delete custom category';
      }
    });
  }

  validateForm(): string | null {
    if (!this.form.description.trim()) {
      return 'Please enter a description';
    }
    if (!this.form.amount || this.form.amount <= 0) {
      return 'Please enter a valid amount';
    }
    if (!this.form.selectedCategory || !this.form.selectedCategory.id) {
      return 'Please select a category';
    }
    if (this.form.selectedParticipants.length === 0) {
      return 'Please select at least one participant';
    }
    return null;
  }

  onSubmit() {
    const validationError = this.validateForm();
    if (validationError) {
      this.errorMessage = validationError;
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    if (this.isEditMode && this.expense) {
      // Update existing expense (when update endpoint is available)
      this.errorMessage = 'Update functionality coming soon';
      this.isLoading = false;
    } else {
      // Create new expense
      const expenseData: any = {
        team_id: this.teamId,
        total_amount: this.form.amount!,
        participants: this.form.selectedParticipants,
        note: this.form.description.trim() || null
      };
      
      // Only add category fields if they have valid values
      if (this.form.selectedCategory) {
        if (this.form.selectedCategory.type === 'default' && this.form.selectedCategory.id) {
          expenseData.category_id = this.form.selectedCategory.id;
        } else if (this.form.selectedCategory.type === 'team' && this.form.selectedCategory.id) {
          expenseData.team_category_id = this.form.selectedCategory.id;
        }
      }
      
      this.expenseService.createExpense(expenseData).subscribe({
        next: (expense) => {
          this.expenseCreated.emit(expense);
          this.onCancel();
        },
        error: (error: any) => {
          console.error('Error creating expense:', error);
          this.errorMessage = error.error?.detail || 'Failed to create expense';
          this.isLoading = false;
        }
      });
    }
  }

  onCancel() {
    this.close.emit();
    this.resetForm();
    this.isLoading = false;
  }

  onBackdropClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.onCancel();
    }
  }

  getParticipantCount(): number {
    return this.form.selectedParticipants.length;
  }

  getAmountPerParticipant(): number {
    if (!this.form.amount || this.form.selectedParticipants.length === 0) {
      return 0;
    }
    return this.form.amount / this.form.selectedParticipants.length;
  }
}