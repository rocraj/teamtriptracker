import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TeamService } from '../../services/team.service';
import { ExpenseService } from '../../services/expense.service';
import { SummaryService } from '../../services/summary.service';
import { AuthService } from '../../services/auth.service';
import { getErrorMessage } from '../../utils/validation';

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
  loading: boolean = true;
  error: string = '';
  activeTab: 'expenses' | 'balances' | 'settlements' = 'expenses';
  showInviteModal: boolean = false;
  showDeleteModal: boolean = false;
  showEditModal: boolean = false;
  currentUserId: string = '';
  editTeamName: string = '';
  editTeamBudget: number | null = null;
  Math = Math;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private teamService: TeamService,
    private expenseService: ExpenseService,
    private summaryService: SummaryService,
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
    this.router.navigate(['/teams', this.teamId, 'add-expense']);
  }

  openInviteModal(): void {
    this.showInviteModal = true;
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

  openDeleteModal(): void {
    if (this.isTeamCreator()) {
      this.showDeleteModal = true;
    }
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
  }

  confirmDelete(): void {
    if (!this.isTeamCreator()) {
      this.error = 'Only the team creator can delete this team';
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
    if (this.isTeamCreator()) {
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
}
