import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TeamService } from '../../services/team.service';
import { ExpenseService } from '../../services/expense.service';
import { BudgetService } from '../../services/budget.service';
import { SummaryService } from '../../services/summary.service';
import { SettlementService, SettlementRequest } from '../../services/settlement.service';
import { AuthService } from '../../services/auth.service';
import { getErrorMessage } from '../../utils/validation';
import { Expense, BudgetStatus, BudgetInsights } from '../../models/index';
import { ExpenseDrawerComponent } from '../../components/expense-drawer/expense-drawer.component';

@Component({
  selector: 'app-team-detail-page',
  templateUrl: './team-detail.page.html',
  styleUrls: ['./team-detail.page.css']
})
export class TeamDetailPageComponent implements OnInit {
  teamId: string = '';
  team: any = null;
  expenses: any[] = [];
  members: any[] = [];
  balances: any = {};
  settlements: any[] = [];
  budgetStatus: BudgetStatus[] = [];
  budgetInsights: BudgetInsights | null = null;
  loading: boolean = true;
  error: string = '';
  activeTab: 'expenses' | 'balances' | 'settlements' | 'budgets' = 'expenses';
  showInviteModal: boolean = false;
  showDeleteModal: boolean = false;
  showEditModal: boolean = false;
  showDeleteExpenseModal: boolean = false;
  showExpenseDrawer: boolean = false;
  editingExpense: Expense | null = null;
  currentUserId: string = '';
  editTeamName: string = '';
  editTeamBudget: number | null = null;
  deleteConfirmationName: string = '';
  selectedExpense: any = null;
  budgetEditMode: boolean = false;
  editingBudgets: { [userId: string]: number } = {};
  settlementRequests: SettlementRequest[] = [];
  Math = Math;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private teamService: TeamService,
    private expenseService: ExpenseService,
    private budgetService: BudgetService,
    private summaryService: SummaryService,
    private settlementService: SettlementService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUserId = user?.id || '';
    });
    this.route.params.subscribe((params) => {
      this.teamId = params['id'];
      this.loadTeamData();
    });
  }

  loadTeamData(): void {
    this.loading = true;
    this.error = '';

    this.teamService.getTeam(this.teamId).subscribe(
      (team) => {
        this.team = team;
        this.loadMembers();
        this.loadExpenses();
        this.loadSummaries();
        this.loadBudgetData();
        this.loadSettlementRequests();
      },
      (error) => {
        this.error = getErrorMessage(error);
        this.loading = false;
      }
    );
  }

  loadMembers(): void {
    this.teamService.getMembers(this.teamId).subscribe(
      (members) => {
        this.members = members;
      },
      (error) => {
        this.error = getErrorMessage(error);
      }
    );
  }

  loadExpenses(): void {
    this.expenseService.listExpenses(this.teamId, 100).subscribe(
      (expenses) => {
        this.expenses = expenses;
      },
      (error) => {
        this.error = getErrorMessage(error);
      }
    );
  }

  loadSummaries(): void {
    this.summaryService.getBalances(this.teamId).subscribe(
      (balances) => {
        this.balances = balances;
      },
      (error) => {
        this.error = getErrorMessage(error);
      }
    );

    this.summaryService.getSettlements(this.teamId).subscribe(
      (response) => {
        console.log('Settlements response:', response);
        console.log('Current members:', this.members.map(m => ({ user_id: m.user_id, name: m.user_name })));
        this.settlements = response.settlements;
        this.loading = false;
      },
      (error) => {
        this.error = getErrorMessage(error);
        this.loading = false;
      }
    );
  }

  addExpense(): void {
    if (this.isTeamMember()) {
      this.router.navigate(['/teams', this.teamId, 'add-expense']);
    }
  }

  openInviteModal(): void {
    if (this.isTeamMember()) {
      this.showInviteModal = true;
    }
  }

  closeInviteModal(): void {
    this.showInviteModal = false;
  }

  onMembersInvited(): void {
    this.loadMembers();
    this.closeInviteModal();
  }

  isTeamCreator(): boolean {
    return this.team && this.currentUserId && this.team.created_by === this.currentUserId;
  }

  isTeamMember(): boolean {
    return !!(this.currentUserId && this.members.some(member => member.user_id === this.currentUserId));
  }

  openAddExpenseDrawer() {
    this.editingExpense = null;
    this.showExpenseDrawer = true;
  }

  openEditExpenseDrawer(expense: Expense) {
    this.editingExpense = expense;
    this.showExpenseDrawer = true;
  }

  closeExpenseDrawer() {
    this.showExpenseDrawer = false;
    this.editingExpense = null;
  }

  onExpenseCreated(expense: any) {
    // Refresh all data that depends on expenses
    this.loadExpenses();
    this.loadSummaries(); // Reload balances and settlements
    this.loadBudgetData(); // Reload budget status and insights
  }

  onExpenseUpdated(expense: any) {
    // Refresh all data that depends on expenses
    this.loadExpenses();
    this.loadSummaries(); // Reload balances and settlements
    this.loadBudgetData(); // Reload budget status and insights
  }

  canDeleteExpense(expense: any): boolean {
    // Only expense payer or team creator can delete expenses
    return !!(this.currentUserId && (
      expense.payer_id === this.currentUserId || 
      this.isTeamCreator()
    ));
  }

  getPersonalizedUserName(userId: string): string {
    // Show "You" if it's the current user, otherwise use the member name
    if (userId === this.currentUserId) {
      return 'You';
    }
    
    // Find the member and return their name
    const member = this.members.find(m => m.user_id === userId);
    return member?.user_name || 'Unknown User';
  }

  // Budget management methods
  loadBudgetData(): void {
    this.loadBudgetStatus();
    this.loadBudgetInsights();
  }

  loadBudgetStatus(): void {
    this.budgetService.getBudgetStatus(this.teamId).subscribe({
      next: (status) => {
        this.budgetStatus = status;
      },
      error: (error) => {
        console.error('Error loading budget status:', error);
      }
    });
  }

  loadBudgetInsights(): void {
    this.budgetService.getBudgetInsights(this.teamId).subscribe({
      next: (insights) => {
        this.budgetInsights = insights;
      },
      error: (error) => {
        console.error('Error loading budget insights:', error);
      }
    });
  }

  updateMemberBudget(userId: string, newBudget: number): void {
    this.budgetService.updateMemberBudget(this.teamId, userId, newBudget).subscribe({
      next: (success) => {
        if (success) {
          this.loadBudgetData(); // Refresh budget data
        }
      },
      error: (error) => {
        console.error('Error updating budget:', error);
      }
    });
  }

  recalculateBudgetsEqually(): void {
    this.budgetService.recalculateBudgetsEqually(this.teamId).subscribe({
      next: (success) => {
        if (success) {
          this.loadBudgetData(); // Refresh budget data
          // Exit edit mode after recalculation
          this.budgetEditMode = false;
          this.editingBudgets = {};
        }
      },
      error: (error) => {
        console.error('Error recalculating budgets:', error);
      }
    });
  }

  toggleBudgetEditMode(): void {
    this.budgetEditMode = !this.budgetEditMode;
    
    if (this.budgetEditMode) {
      // Initialize editing budgets with current values
      this.editingBudgets = {};
      this.budgetStatus.forEach(member => {
        this.editingBudgets[member.user_id] = member.initial_budget;
      });
    } else {
      // Clear editing state
      this.editingBudgets = {};
    }
  }

  saveMemberBudget(userId: string): void {
    const newBudget = this.editingBudgets[userId];
    
    if (newBudget === undefined || newBudget < 0) {
      console.error('Invalid budget amount');
      return;
    }
    
    this.budgetService.updateMemberBudget(this.teamId, userId, newBudget).subscribe({
      next: (success) => {
        if (success) {
          this.loadBudgetData(); // Refresh budget data
          // Update the editing value to match the new saved value
          const updatedMember = this.budgetStatus.find(m => m.user_id === userId);
          if (updatedMember) {
            this.editingBudgets[userId] = updatedMember.initial_budget;
          }
        }
      },
      error: (error) => {
        console.error('Error updating budget:', error);
        // Reset editing value to original
        const originalMember = this.budgetStatus.find(m => m.user_id === userId);
        if (originalMember) {
          this.editingBudgets[userId] = originalMember.initial_budget;
        }
      }
    });
  }

  openDeleteModal(): void {
    if (this.isTeamCreator()) {
      this.showDeleteModal = true;
    }
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.deleteConfirmationName = '';
  }

  confirmDelete(): void {
    if (!this.isTeamCreator()) {
      this.error = 'Only the team creator can delete this team';
      return;
    }

    if (this.deleteConfirmationName !== this.team.name) {
      this.error = `Team name must match exactly to delete`;
      return;
    }

    this.loading = true;
    this.error = '';

    this.teamService.deleteTeam(this.teamId).subscribe(
      () => {
        this.loading = false;
        this.router.navigate(['/dashboard']);
      },
      (error) => {
        this.loading = false;
        this.error = getErrorMessage(error);
        this.closeDeleteModal();
      }
    );
  }

  openEditModal(): void {
    if (this.isTeamMember()) {
      this.editTeamName = this.team.name;
      this.editTeamBudget = this.team.trip_budget || null;
      this.showEditModal = true;
    }
  }

  closeEditModal(): void {
    this.showEditModal = false;
  }

  saveTeamChanges(): void {
    if (!this.editTeamName.trim()) {
      this.error = 'Team name cannot be empty';
      return;
    }

    this.loading = true;
    this.error = '';

    this.teamService.updateTeam(this.teamId, this.editTeamName, this.editTeamBudget || undefined).subscribe(
      (updatedTeam) => {
        this.loading = false;
        this.team = updatedTeam;
        this.closeEditModal();
      },
      (error) => {
        this.loading = false;
        this.error = getErrorMessage(error);
      }
    );
  }

  // Expense delete methods
  openDeleteExpenseModal(expense: any): void {
    if (this.canDeleteExpense(expense)) {
      this.selectedExpense = expense;
      this.showDeleteExpenseModal = true;
    }
  }

  closeDeleteExpenseModal(): void {
    this.showDeleteExpenseModal = false;
    this.selectedExpense = null;
  }

  confirmDeleteExpense(): void {
    if (!this.selectedExpense) return;

    this.loading = true;
    this.error = '';

    this.expenseService.deleteExpense(this.selectedExpense.id).subscribe(
      () => {
        this.loading = false;
        this.loadExpenses(); // Reload expenses
        this.loadSummaries(); // Reload balances and settlements
        this.loadBudgetData(); // Reload budget status and insights
        this.closeDeleteExpenseModal();
      },
      (error) => {
        this.loading = false;
        this.error = getErrorMessage(error);
        this.closeDeleteExpenseModal();
      }
    );
  }

  // Tab management
  setActiveTab(tab: 'expenses' | 'balances' | 'settlements' | 'budgets'): void {
    this.activeTab = tab;
    
    // Refresh data when switching to specific tabs
    if (tab === 'settlements') {
      this.loadSettlementRequests();
      this.loadSummaries(); // Refresh settlements calculation
    } else if (tab === 'budgets') {
      this.loadBudgetData();
    }
  }

  // Settlement request methods
  loadSettlementRequests(): void {
    this.settlementService.getUserSettlementRequests(this.teamId).subscribe(
      (response) => {
        this.settlementRequests = response.settlement_requests;
      },
      (error) => {
        this.error = getErrorMessage(error);
      }
    );
  }

  hasPendingSettlement(toUserId: string): boolean {
    return this.settlementRequests.some(request => 
      request.type === 'sent' &&
      request.other_user_id === toUserId &&
      request.status === 'pending'
    );
  }

  createSettlementRequest(toUserId: string, amount: number): void {
    console.log('Creating settlement request:', { 
      teamId: this.teamId, 
      toUserId, 
      amount, 
      currentUserId: this.currentUserId,
      members: this.members.map(m => ({ user_id: m.user_id, name: m.user_name }))
    });
    
    // Validate that toUserId is a valid team member
    const toMember = this.members.find(m => m.user_id === toUserId);
    if (!toMember) {
      this.error = 'Invalid recipient: User is not a team member';
      return;
    }

    // Check if there's already a pending settlement
    if (this.hasPendingSettlement(toUserId)) {
      this.error = 'A settlement request is already pending with this user';
      return;
    }
    
    this.settlementService.createSettlementRequest(this.teamId, {
      to_user_id: toUserId,
      amount: amount
    }).subscribe(
      (response) => {
        this.loadSettlementRequests(); // Reload settlement requests
        this.loadSummaries(); // Reload settlements to reflect any changes
        console.log('Settlement request created successfully:', response);
        // Clear any previous errors
        this.error = '';
      },
      (error) => {
        console.error('Settlement request failed:', error);
        // Provide user-friendly error messages
        if (error.response?.data?.detail) {
          const detail = error.response.data.detail;
          if (detail.includes('pending settlement request already exists')) {
            this.error = 'A settlement request is already pending with this user. Please wait for them to respond or check your pending requests.';
          } else {
            this.error = detail;
          }
        } else {
          this.error = getErrorMessage(error);
        }
      }
    );
  }

  approveSettlement(settlementId: string): void {
    this.settlementService.approveSettlement(settlementId).subscribe(
      (response) => {
        this.loadSettlementRequests(); // Reload settlement requests
        this.loadSummaries(); // Reload balances and settlements
        this.loadBudgetData(); // Reload budget data since balances changed
        // Show success message could be added here
      },
      (error) => {
        this.error = getErrorMessage(error);
      }
    );
  }
}
