import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TeamService } from '../../services/team.service';
import { getErrorMessage } from '../../utils/validation';

@Component({
  selector: 'app-invite-members-modal',
  templateUrl: './invite-members-modal.component.html',
  styleUrls: ['./invite-members-modal.component.css']
})
export class InviteMembersModalComponent {
  @Input() isOpen: boolean = false;
  @Input() teamId: string = '';
  @Output() close = new EventEmitter<void>();
  @Output() membersInvited = new EventEmitter<any>();

  emails: string[] = [''];
  loading: boolean = false;
  error: string = '';
  success: string = '';
  invitedCount: number = 0;

  constructor(private teamService: TeamService) {}

  get validEmailCount(): number {
    return this.emails.filter(email => email.trim()).length;
  }

  closeModal(): void {
    this.resetForm();
    this.close.emit();
  }

  resetForm(): void {
    this.emails = [''];
    this.error = '';
    this.success = '';
    this.invitedCount = 0;
  }

  addEmailField(): void {
    this.emails.push('');
  }

  removeEmailField(index: number): void {
    if (this.emails.length > 1) {
      this.emails.splice(index, 1);
    }
  }

  trackByIndex(index: number): number {
    return index;
  }

  sendInvites(): void {
    // Filter out empty emails
    const validEmails = this.emails.filter(email => email.trim());

    if (validEmails.length === 0) {
      this.error = 'Please enter at least one email address';
      return;
    }

    // Validate emails
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = validEmails.filter(email => !emailRegex.test(email));
    if (invalidEmails.length > 0) {
      this.error = `Invalid email format: ${invalidEmails.join(', ')}`;
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';
    this.invitedCount = 0;

    // Send invites for each email
    let completed = 0;
    let failed = false;

    validEmails.forEach(email => {
      this.teamService.inviteMember(this.teamId, email).subscribe(
        (response) => {
          completed++;
          this.invitedCount = completed;

          if (completed === validEmails.length) {
            this.loading = false;
            if (!failed) {
              this.success = `Successfully invited ${this.invitedCount} member${this.invitedCount > 1 ? 's' : ''}!`;
              setTimeout(() => {
                this.membersInvited.emit({ count: this.invitedCount });
                this.closeModal();
              }, 1500);
            }
          }
        },
        (error) => {
          failed = true;
          this.error = `Failed to invite ${email}: ${getErrorMessage(error)}`;
          this.loading = false;
        }
      );
    });
  }
}
