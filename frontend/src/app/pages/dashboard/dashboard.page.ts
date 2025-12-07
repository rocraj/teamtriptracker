import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TeamService } from '../../services/team.service';
import { ExpenseService } from '../../services/expense.service';
import { SummaryService } from '../../services/summary.service';
import { CreateTeamModalComponent } from '../../components/shared/create-team-modal.component';
import { getErrorMessage } from '../../utils/validation';

@Component({
  selector: 'app-dashboard-page',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.css']
})
export class DashboardPageComponent implements OnInit {
  @ViewChild(CreateTeamModalComponent) createTeamModal!: CreateTeamModalComponent;

  teams: any[] = [];
  recentExpenses: any[] = [];
  loading: boolean = true;
  error: string = '';
  showCreateTeamModal: boolean = false;

  constructor(
    private teamService: TeamService,
    private expenseService: ExpenseService,
    private summaryService: SummaryService,
    private router: Router
  ) {}

  ngOnInit(): void {
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

        // Fetch member counts for all teams
        this.loadMemberCounts();

        if (teams.length > 0) {
          this.loadRecentExpenses(teams[0].id);
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

  loadRecentExpenses(teamId: string): void {
    this.expenseService.listExpenses(teamId, 5).subscribe(
      (expenses) => {
        this.recentExpenses = expenses;
        this.loading = false;
      },
      (error) => {
        this.error = getErrorMessage(error);
        this.loading = false;
      }
    );
  }

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
