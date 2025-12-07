import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TeamService } from '../../services/team.service';
import { ExpenseService } from '../../services/expense.service';
import { SummaryService } from '../../services/summary.service';
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
  Math = Math;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private teamService: TeamService,
    private expenseService: ExpenseService,
    private summaryService: SummaryService
  ) {}

  ngOnInit(): void {
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
}
