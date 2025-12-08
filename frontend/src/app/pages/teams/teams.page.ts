import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TeamService } from '../../services/team.service';
import { BudgetService } from '../../services/budget.service';
import { AuthService } from '../../services/auth.service';
import { BudgetStatus } from '../../models/index';
import { getErrorMessage } from '../../utils/validation';

@Component({
  selector: 'app-teams-page',
  templateUrl: './teams.page.html',
  styleUrls: ['./teams.page.css']
})
export class TeamsPageComponent implements OnInit {
  teams: any[] = [];
  userWalletData: { [teamId: string]: BudgetStatus } = {};
  totalNetBalance: number = 0;
  currentUserId: string = '';
  loading: boolean = true;
  error: string = '';
  showCreateForm: boolean = false;
  newTeamName: string = '';
  // Add Object to component for template access
  Object = Object;

  constructor(
    private teamService: TeamService,
    private budgetService: BudgetService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    this.currentUserId = currentUser?.id || '';
    this.loadTeams();
  }

  loadTeams(): void {
    this.loading = true;
    this.error = '';

    this.teamService.listTeams().subscribe(
      (teams) => {
        this.teams = teams;
        this.loadWalletData();
        this.loading = false;
      },
      (error) => {
        this.error = getErrorMessage(error);
        this.loading = false;
      }
    );
  }

  loadWalletData(): void {
    // Load wallet data for each team the user is part of
    this.teams.forEach(team => {
      this.budgetService.getBudgetStatus(team.id).subscribe({
        next: (budgetStatuses) => {
          // Find current user's budget status in this team
          const userBudget = budgetStatuses.find(status => status.user_id === this.currentUserId);
          if (userBudget) {
            this.userWalletData[team.id] = userBudget;
            this.calculateTotalNetBalance();
          }
        },
        error: (error) => {
          console.error(`Error loading wallet data for team ${team.id}:`, error);
        }
      });
    });
  }

  calculateTotalNetBalance(): void {
    this.totalNetBalance = Object.values(this.userWalletData)
      .reduce((total, budget) => total + budget.current_balance, 0);
  }

  getWalletStatus(): 'positive' | 'negative' | 'neutral' {
    if (this.totalNetBalance > 0) return 'positive';
    if (this.totalNetBalance < 0) return 'negative';
    return 'neutral';
  }

  createTeam(): void {
    if (!this.newTeamName.trim()) {
      this.error = 'Please enter a team name';
      return;
    }

    this.teamService.createTeam(this.newTeamName).subscribe(
      (team) => {
        this.teams.push(team);
        this.newTeamName = '';
        this.showCreateForm = false;
        this.loadWalletData(); // Reload wallet data after creating team
      },
      (error) => {
        this.error = getErrorMessage(error);
      }
    );
  }

  viewTeam(teamId: string): void {
    this.router.navigate(['/teams', teamId]);
  }
}
