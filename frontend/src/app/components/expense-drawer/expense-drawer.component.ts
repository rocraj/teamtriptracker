import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TeamService } from '../../services/team.service';
import { ExpenseService } from '../../services/expense.service';
import { BudgetService } from '../../services/budget.service';
import { CategoryService, ExpenseCategory, TeamCustomCategory, TeamCategoriesResponse } from '../../services/category.service';
import { AuthService } from '../../services/auth.service';
import { Expense, PayerSuggestion } from '../../models/index';
import { EmojiPickerComponent } from '../shared/emoji-picker.component';

interface TeamMemberWithUser {
  id: string;
  user_id: string;
  team_id: string;
  initial_budget: number;
  user_name: string;
  user_email: string;
  photo_url?: string;
  created_at: string;
  modified_at: string;
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
  
  // Payer suggestion properties
  payerSuggestion: PayerSuggestion | null = null;
  showPayerSuggestion = false;
  suggestionDismissed = false;

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

  // Form state persistence
  private savedFormState: ExpenseForm | null = null;
  private savedCustomCategoryState = {
    name: '',
    emoji: '💰',
    showCustomCategory: false,
    showEmojiPicker: false
  };

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
    private budgetService: BudgetService,
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
      
      // Determine split type based on participants
      const allMemberIds = this.teamMembers.map(m => m.user_id);
      const isEqualSplit = this.expense.participants.length === allMemberIds.length && 
                          this.expense.participants.every(p => allMemberIds.includes(p));
      
      this.form = {
        description: this.expense.note || '',
        amount: this.expense.total_amount,
        selectedCategory,
        splitType: isEqualSplit ? 'equal' : 'selected',
        selectedParticipants: [...this.expense.participants]
      };
      this.selectedCategoryValue = dropdownValue;
    } else {
      // Add mode - try to restore saved state, otherwise reset to defaults
      if (this.savedFormState) {
        this.restoreFormState();
      } else {
        this.resetForm();
      }
    }
    this.errorMessage = '';
  }

  resetForm(saveCurrentState: boolean = false) {
    if (saveCurrentState && !this.isEditMode) {
      // Save current form state before resetting (only in add mode)
      this.saveFormState();
    }
    
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
        // Only auto-select if no participants are already selected (to preserve saved state)
        if (!this.isEditMode && this.form.splitType === 'equal' && this.form.selectedParticipants.length === 0) {
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
        this.defaultCategories = response.default.map(cat => ({
          ...cat,
          color: this.categoryService.getCategoryColor(cat.name)
        }));
        this.teamCustomCategories = response.custom;
        
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
    
    // Update smart suggestions when split type changes
    if (this.form.amount && this.form.amount > 0 && !this.suggestionDismissed) {
      this.getSuggestedPayer();
    }
  }

  toggleParticipant(userId: string) {
    const index = this.form.selectedParticipants.indexOf(userId);
    if (index > -1) {
      this.form.selectedParticipants.splice(index, 1);
    } else {
      this.form.selectedParticipants.push(userId);
    }
    
    // Update smart suggestions when participants change
    if (this.form.amount && this.form.amount > 0 && !this.suggestionDismissed) {
      this.getSuggestedPayer();
    }
  }

  isParticipantSelected(userId: string): boolean {
    return this.form.selectedParticipants.includes(userId);
  }

  createCustomCategory() {
    if (this.customCategoryName.trim()) {
      this.categoryService.createTeamCustomCategory(this.teamId, {
        name: this.customCategoryName.trim(),
        emoji: this.customCategoryEmoji,
        team_id: this.teamId
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
      // Update existing expense
      const updateData: any = {
        total_amount: this.form.amount!,
        participants: this.form.selectedParticipants,
        note: this.form.description.trim() || null
      };
      
      // Handle category updates
      if (this.form.selectedCategory) {
        if (this.form.selectedCategory.type === 'default' && this.form.selectedCategory.id) {
          updateData.category_id = this.form.selectedCategory.id;
          updateData.team_category_id = null; // Clear team category
        } else if (this.form.selectedCategory.type === 'team' && this.form.selectedCategory.id) {
          updateData.team_category_id = this.form.selectedCategory.id;
          updateData.category_id = null; // Clear regular category
        }
      } else {
        // Clear both if no category selected
        updateData.category_id = null;
        updateData.team_category_id = null;
      }
      
      this.expenseService.updateExpense(this.expense.id, updateData).subscribe({
        next: (expense) => {
          this.expenseUpdated.emit(expense);
          this.close.emit();
        },
        error: (error: any) => {
          console.error('Error updating expense:', error);
          this.errorMessage = error.error?.detail || 'Failed to update expense';
          this.isLoading = false;
        }
      });
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
          this.clearSavedFormState(); // Clear saved state on successful creation
          this.expenseCreated.emit(expense);
          this.close.emit();
          this.resetForm(); // Reset without saving state
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
    this.resetForm(true); // Save state when canceling
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

  // Form state persistence methods
  private saveFormState() {
    // Only save if there's meaningful data
    if (this.form.description.trim() || this.form.amount || this.form.selectedCategory) {
      this.savedFormState = { ...this.form };
      this.savedCustomCategoryState = {
        name: this.customCategoryName,
        emoji: this.customCategoryEmoji,
        showCustomCategory: this.showCustomCategory,
        showEmojiPicker: this.showEmojiPicker
      };
    }
  }

  private restoreFormState() {
    if (this.savedFormState) {
      this.form = { ...this.savedFormState };
      
      // Restore category dropdown value
      if (this.form.selectedCategory) {
        this.selectedCategoryValue = `${this.form.selectedCategory.type}:${this.form.selectedCategory.id}`;
      }
      
      // Restore custom category state
      this.customCategoryName = this.savedCustomCategoryState.name;
      this.customCategoryEmoji = this.savedCustomCategoryState.emoji;
      this.showCustomCategory = this.savedCustomCategoryState.showCustomCategory;
      this.showEmojiPicker = this.savedCustomCategoryState.showEmojiPicker;
    }
  }

  private clearSavedFormState() {
    this.savedFormState = null;
    this.savedCustomCategoryState = {
      name: '',
      emoji: '💰',
      showCustomCategory: false,
      showEmojiPicker: false
    };
  }

  // Payer suggestion methods
  onAmountChange() {
    if (this.form.amount && this.form.amount > 0 && !this.suggestionDismissed) {
      this.getSuggestedPayer();
    } else {
      this.showPayerSuggestion = false;
    }
  }

  private getSuggestedPayer() {
    if (!this.form.amount || this.form.amount <= 0) return;
    
    this.budgetService.suggestOptimalPayer(this.teamId, this.form.amount).subscribe({
      next: (suggestion) => {
        this.payerSuggestion = suggestion;
        this.showPayerSuggestion = !!suggestion && !this.suggestionDismissed;
      },
      error: (error) => {
        console.error('Error getting payer suggestion:', error);
        this.showPayerSuggestion = false;
      }
    });
  }

  acceptPayerSuggestion() {
    if (this.payerSuggestion) {
      // Note: In current implementation, payer is always current user
      // This suggestion is for awareness only
      this.showPayerSuggestion = false;
      this.suggestionDismissed = true;
    }
  }

  dismissPayerSuggestion() {
    this.showPayerSuggestion = false;
    this.suggestionDismissed = true;
  }
}