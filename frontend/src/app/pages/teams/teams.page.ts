import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TeamService } from '../../services/team.service';
import { getErrorMessage } from '../../utils/validation';

@Component({
  selector: 'app-teams-page',
  templateUrl: './teams.page.html',
  styleUrls: ['./teams.page.css']
})
export class TeamsPageComponent implements OnInit {
  teams: any[] = [];
  loading: boolean = true;
  error: string = '';
  showCreateForm: boolean = false;
  newTeamName: string = '';

  constructor(
    private teamService: TeamService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadTeams();
  }

  loadTeams(): void {
    this.loading = true;
    this.error = '';

    this.teamService.listTeams().subscribe(
      (teams) => {
        this.teams = teams;
        this.loading = false;
      },
      (error) => {
        this.error = getErrorMessage(error);
        this.loading = false;
      }
    );
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
