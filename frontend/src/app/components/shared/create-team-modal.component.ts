import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TeamService } from '../../services/team.service';
import { getErrorMessage } from '../../utils/validation';

@Component({
  selector: 'app-create-team-modal',
  templateUrl: './create-team-modal.component.html',
  styleUrls: ['./create-team-modal.component.css']
})
export class CreateTeamModalComponent {
  @Input() isOpen: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() teamCreated = new EventEmitter<any>();

  teamName: string = '';
  loading: boolean = false;
  error: string = '';

  constructor(private teamService: TeamService) {}

  openModal(): void {
    this.isOpen = true;
    this.teamName = '';
    this.error = '';
  }

  closeModal(): void {
    this.isOpen = false;
    this.close.emit();
  }

  createTeam(): void {
    if (!this.teamName.trim()) {
      this.error = 'Please enter a team name';
      return;
    }

    this.loading = true;
    this.error = '';

    this.teamService.createTeam(this.teamName).subscribe(
      (team) => {
        this.loading = false;
        this.teamCreated.emit(team);
        this.closeModal();
      },
      (error) => {
        this.loading = false;
        this.error = getErrorMessage(error);
      }
    );
  }

  onBackdropClick(): void {
    this.closeModal();
  }

  onModalClick(event: Event): void {
    event.stopPropagation();
  }
}
