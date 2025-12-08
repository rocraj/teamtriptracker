import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TeamService } from '../../services/team.service';
import { ExpenseService } from '../../services/expense.service';
import { SummaryService } from '../../services/summary.service';
import { BudgetService } from '../../services/budget.service';
import { AuthService } from '../../services/auth.service';
import { CreateTeamModalComponent } from '../../components/shared/create-team-modal.component';
import { getErrorMessage } from '../../utils/validation';
import { getRelativeTime } from '../../utils/format';

@Component({
  selector: 'app-dashboard-page',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.css']
})
export class DashboardPageComponent implements OnInit {
  @ViewChild(CreateTeamModalComponent) createTeamModal!: CreateTeamModalComponent;

  teams: any[] = [];
  recentExpenses: any[] = [];
  userWalletData: { [teamId: string]: any } = {};
  totalNetBalance: number = 0;
  currentUser: any = null;
  loading: boolean = true;
  error: string = '';
  showCreateTeamModal: boolean = false;

  constructor(
    private teamService: TeamService,
    private expenseService: ExpenseService,
    private summaryService: SummaryService,
    private budgetService: BudgetService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading = true;
    this.error = '';

    this.teamService.listTeams().subscribe(
      (teams) => {
        // Initialize teams with placeholder member count
        this.teams = teams.map(team => ({
          ...team,
          member_count: 0
        }));

        // Fetch member counts and wallet data for all teams
        this.loadMemberCounts();
        this.loadWalletData();

        if (teams.length > 0) {
          this.loadRecentExpenses();
        } else {
          this.loading = false;
        }
      },
      (error) => {
        this.error = getErrorMessage(error);
        this.loading = false;
      }
    );
  }

  loadMemberCounts(): void {
    this.teams.forEach((team, index) => {
      this.teamService.getMembers(team.id).subscribe(
        (members) => {
          this.teams[index].member_count = members.length;
        },
        (error) => {
          console.error(`Error loading members for team ${team.id}:`, error);
          this.teams[index].member_count = 0;
        }
      );
    });
  }

  loadRecentExpenses(): void {
    // Load recent expenses from all teams
    let allExpenses: any[] = [];
    let teamsProcessed = 0;

    if (this.teams.length === 0) {
      this.loading = false;
      return;
    }

    this.teams.forEach(team => {
      this.expenseService.listExpenses(team.id, 10).subscribe(
        (expenses) => {
          allExpenses = allExpenses.concat(expenses);
          teamsProcessed++;
          
          if (teamsProcessed === this.teams.length) {
            // Sort by date and take most recent 5
            this.recentExpenses = allExpenses
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .slice(0, 5);
            this.loading = false;
          }
        },
        (error) => {
          teamsProcessed++;
          if (teamsProcessed === this.teams.length) {
            this.loading = false;
          }
        }
      );
    });
  }

  loadWalletData(): void {
    this.totalNetBalance = 0;
    
    this.teams.forEach(team => {
      this.budgetService.getBudgetStatus(team.id).subscribe(
        (response) => {
          const userBudget = response.find(
            (status: any) => status.user_id === this.currentUser?.id
          );
          
          if (userBudget) {
            this.userWalletData[team.id] = {
              current_balance: userBudget.current_balance,
              remaining_budget: userBudget.remaining_budget,
              is_over_budget: userBudget.is_over_budget
            };
            this.totalNetBalance += userBudget.current_balance;
          }
        },
        (error) => {
          console.error(`Error loading wallet data for team ${team.id}:`, error);
        }
      );
    });
  }

  getPersonalizedUserName(userId: string): string {
    if (this.currentUser && userId === this.currentUser.id) {
      return 'You';
    }
    return userId; // This would be replaced by actual user name lookup
  }

  getRelativeTime = getRelativeTime;

  goToTeam(teamId: string): void {
    this.router.navigate(['/teams', teamId]);
  }

  goToAddExpense(teamId: string): void {
    this.router.navigate(['/teams', teamId, 'add-expense']);
  }

  createNewTeam(): void {
    this.showCreateTeamModal = true;
  }

  onTeamCreated(team: any): void {
    // Add the new team to the list
    this.teams.push(team);
    this.showCreateTeamModal = false;
  }

  onCloseCreateTeamModal(): void {
    this.showCreateTeamModal = false;
  }
}
