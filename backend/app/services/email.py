"""Email service for sending invitations and notifications."""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Optional
import logging

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending emails via SMTP."""
    
    @staticmethod
    def send_invitation_email(
        recipient_email: str,
        recipient_name: str,
        team_name: str,
        inviter_name: str,
        invitation_link: str
    ) -> bool:
        """Send team invitation email to a recipient.
        
        Args:
            recipient_email: Email address of the invitee
            recipient_name: Name of the invitee
            team_name: Name of the team
            inviter_name: Name of the person sending the invitation
            invitation_link: Full URL link for accepting the invitation
            
        Returns:
            True if email was sent successfully, False otherwise
        """
        settings = get_settings()
        
        # Validate SMTP settings
        if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
            logger.error("SMTP credentials not configured")
            return False
        
        try:
            # Create message
            message = MIMEMultipart("alternative")
            message["Subject"] = f"You're invited to join {team_name} on TeamTripTracker"
            message["From"] = settings.SMTP_USER
            message["To"] = recipient_email
            
            # HTML email body
            html_body = f"""
            <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #2c3e50;">Welcome to TeamTripTracker!</h2>
                        <p>Hi {recipient_name},</p>
                        <p><strong>{inviter_name}</strong> has invited you to join the team <strong>{team_name}</strong> on TeamTripTracker, a collaborative expense tracking app for group trips.</p>
                        
                        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                            <p>Click the button below to accept the invitation:</p>
                            <a href="{invitation_link}" style="background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Accept Invitation</a>
                        </div>
                        
                        <p>Or copy and paste this link in your browser:</p>
                        <p style="word-break: break-all; background-color: #f0f0f0; padding: 10px; border-radius: 3px;">
                            {invitation_link}
                        </p>
                        
                        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                        <p style="font-size: 12px; color: #666;">
                            If you didn't expect this invitation or have any questions, please contact the person who sent it.
                        </p>
                        <p style="font-size: 12px; color: #666;">
                            TeamTripTracker - Making group expenses simple
                        </p>
                    </div>
                </body>
            </html>
            """
            
            # Text fallback
            text_body = f"""
Hi {recipient_name},

{inviter_name} has invited you to join the team {team_name} on TeamTripTracker.

Click the link below to accept the invitation:
{invitation_link}

If you didn't expect this invitation, please disregard this email.

TeamTripTracker - Making group expenses simple
            """
            
            # Attach both HTML and text versions
            part1 = MIMEText(text_body, "plain")
            part2 = MIMEText(html_body, "html")
            message.attach(part1)
            message.attach(part2)
            
            # Send email
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(settings.SMTP_USER, recipient_email, message.as_string())
            
            logger.info(f"Invitation email sent to {recipient_email}")
            return True
            
        except smtplib.SMTPAuthenticationError:
            logger.error("SMTP authentication failed - check credentials")
            return False
        except smtplib.SMTPException as e:
            logger.error(f"SMTP error occurred: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Error sending email: {str(e)}")
            return False
    
    @staticmethod
    def send_bulk_invitations(
        recipient_emails: List[str],
        recipient_names: List[str],
        team_name: str,
        inviter_name: str,
        invitation_links: List[str]
    ) -> dict:
        """Send invitations to multiple recipients.
        
        Args:
            recipient_emails: List of email addresses
            recipient_names: List of recipient names (must match length of emails)
            team_name: Name of the team
            inviter_name: Name of the person sending invitations
            invitation_links: List of invitation links (must match length of emails)
            
        Returns:
            Dictionary with success and failure counts and details
        """
        results = {
            "successful": 0,
            "failed": 0,
            "details": []
        }
        
        if not (len(recipient_emails) == len(recipient_names) == len(invitation_links)):
            raise ValueError("Email lists must have matching lengths")
        
        for email, name, link in zip(recipient_emails, recipient_names, invitation_links):
            success = EmailService.send_invitation_email(
                email, name, team_name, inviter_name, link
            )
            
            if success:
                results["successful"] += 1
                results["details"].append({
                    "email": email,
                    "status": "sent"
                })
            else:
                results["failed"] += 1
                results["details"].append({
                    "email": email,
                    "status": "failed"
                })
        
        return results
