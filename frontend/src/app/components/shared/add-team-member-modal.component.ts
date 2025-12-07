import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TeamService } from '../../services/team.service';
import { getErrorMessage } from '../../utils/validation';

@Component({
  selector: 'app-add-team-member-modal',
  templateUrl: './add-team-member-modal.component.html',
  styleUrls: ['./add-team-member-modal.component.css']
})
export class AddTeamMemberModalComponent {
  @Input() isOpen: boolean = false;
  @Input() teamId: string = '';
  @Output() close = new EventEmitter<void>();
  @Output() memberAdded = new EventEmitter<any>();

  userId: string = '';
  loading: boolean = false;
  error: string = '';
  success: string = '';

  constructor(private teamService: TeamService) {}

  closeModal(): void {
    this.resetForm();
    this.close.emit();
  }

  resetForm(): void {
    this.userId = '';
    this.error = '';
    this.success = '';
  }

  addMember(): void {
    if (!this.userId.trim()) {
      this.error = 'Please enter a user ID';
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    this.teamService.addTeamMember(this.teamId, this.userId).subscribe(
      (member) => {
        this.success = 'Member added successfully!';
        this.loading = false;
        setTimeout(() => {
          this.memberAdded.emit(member);
          this.closeModal();
        }, 1000);
      },
      (error) => {
        this.error = getErrorMessage(error);
        this.loading = false;
      }
    );
  }
}
