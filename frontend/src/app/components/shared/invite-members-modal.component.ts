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

    // Use new bulk invite endpoint
    this.teamService.sendBulkInvitations(this.teamId, validEmails).subscribe(
      (response) => {
        this.loading = false;
        this.invitedCount = response.total_invitations_sent;
        
        // Build success message
        let successMsg = `Successfully invited ${response.invited_emails.length} new member${response.invited_emails.length !== 1 ? 's' : ''}`;
        if (response.added_existing_users.length > 0) {
          successMsg += ` and added ${response.added_existing_users.length} existing user${response.added_existing_users.length !== 1 ? 's' : ''}`;
        }
        successMsg += '!';
        
        this.success = successMsg;
        
        if (response.failed_emails.length > 0) {
          this.error = `Failed to send invitations to: ${response.failed_emails.join(', ')}`;
        }
        
        setTimeout(() => {
          this.membersInvited.emit({ 
            count: this.invitedCount,
            result: response
          });
          this.closeModal();
        }, 1500);
      },
      (error) => {
        this.loading = false;
        this.error = getErrorMessage(error) || 'Failed to send invitations';
      }
    );
  }
}
