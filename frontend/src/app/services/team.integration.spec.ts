import { TestBed } from '@angular/core/testing';
import { TeamService } from '../services/team.service';
import { AuthService } from '../services/auth.service';

describe('Team Flow Integration Tests', () => {
  let teamService: TeamService;
  let authService: AuthService;
  let creatorToken: string;
  let memberToken: string;

  beforeEach((done) => {
    TestBed.configureTestingModule({
      providers: [TeamService, AuthService]
    });
    teamService = TestBed.inject(TeamService);
    authService = TestBed.inject(AuthService);
    localStorage.clear();

    // Setup: Create creator user
    authService.register('creator@example.com', 'Creator', 'password123').subscribe(() => {
      authService.currentUser$.subscribe((user) => {
        if (user) {
          creatorToken = localStorage.getItem('token') || '';
          authService.logout();
          // Create member user
          authService
            .register('member@example.com', 'Member', 'password123')
            .subscribe(() => {
              authService.currentUser$.subscribe((memberUser) => {
                if (memberUser) {
                  memberToken = localStorage.getItem('token') || '';
                  authService.logout();
                  done();
                }
              });
            });
        }
      });
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Complete Team Lifecycle', () => {
    it('should complete full team creation flow', (done) => {
      authService.register('teamcreator@example.com', 'Team Creator', 'password123').subscribe(
        () => {
          const teamName = 'Summer Vacation';
          const budget = 5000;

          // Step 1: Create team
          teamService.createTeam(teamName, budget).subscribe(
            (team) => {
              expect(team).toBeTruthy();
              expect(team.name).toBe(teamName);
              expect(team.trip_budget).toBe(budget);

              // Step 2: Verify team is in user's list
              teamService.listTeams().subscribe((teams) => {
                const createdTeam = teams.find((t) => t.id === team.id);
                expect(createdTeam).toBeTruthy();
                expect(createdTeam?.name).toBe(teamName);

                // Step 3: Get team details
                teamService.getTeam(team.id).subscribe((details) => {
                  expect(details.id).toBe(team.id);
                  expect(details.name).toBe(teamName);

                  // Step 4: Get team members (creator should be a member)
                  teamService.getMembers(team.id).subscribe((members) => {
                    expect(members.length).toBeGreaterThan(0);
                    done();
                  });
                });
              });
            }
          );
        }
      );
    });
  });

  describe('Team Update Flow', () => {
    it('should update team name and budget', (done) => {
      authService.register('updateuser@example.com', 'Update User', 'password123').subscribe(() => {
        teamService.createTeam('Original Team', 1000).subscribe((team) => {
          const newName = 'Updated Team';
          const newBudget = 2000;

          // Step 1: Update team
          teamService.updateTeam(team.id, newName, newBudget).subscribe(
            (updatedTeam) => {
              expect(updatedTeam.name).toBe(newName);
              expect(updatedTeam.trip_budget).toBe(newBudget);

              // Step 2: Verify changes persisted
              teamService.getTeam(team.id).subscribe((verified) => {
                expect(verified.name).toBe(newName);
                expect(verified.trip_budget).toBe(newBudget);
                done();
              });
            }
          );
        });
      });
    });

    it('should handle partial updates', (done) => {
      authService.register('partialuser@example.com', 'Partial User', 'password123').subscribe(() => {
        teamService.createTeam('Partial Team', 1000).subscribe((team) => {
          // Update only name
          teamService.updateTeam(team.id, 'New Name').subscribe((updated) => {
            expect(updated.name).toBe('New Name');
            expect(updated.trip_budget).toBe(1000);

            // Update only budget
            teamService.updateTeam(team.id, undefined, 3000).subscribe((updated2) => {
              expect(updated2.name).toBe('New Name');
              expect(updated2.trip_budget).toBe(3000);
              done();
            });
          });
        });
      });
    });
  });

  describe('Team Deletion Flow', () => {
    it('should complete team deletion flow', (done) => {
      authService.register('deleteuser@example.com', 'Delete User', 'password123').subscribe(() => {
        teamService.createTeam('To Delete', 1000).subscribe((team) => {
          const teamId = team.id;

          // Step 1: Verify team exists
          teamService.getTeam(teamId).subscribe((existing) => {
            expect(existing).toBeTruthy();

            // Step 2: Delete team
            teamService.deleteTeam(teamId).subscribe((response) => {
              expect(response.message).toContain('deleted');

              // Step 3: Verify team no longer exists
              teamService.getTeam(teamId).subscribe(
                () => {
                  fail('Team should be deleted');
                },
                () => {
                  // Expected to fail - team deleted
                  done();
                }
              );
            });
          });
        });
      });
    });
  });

  describe('Team Member Management', () => {
    it('should manage team members and budgets', (done) => {
      authService.register('memberadmin@example.com', 'Member Admin', 'password123').subscribe(() => {
        teamService.createTeam('Member Team', 5000).subscribe((team) => {
          // Step 1: Get initial members
          teamService.getMembers(team.id).subscribe((members) => {
            expect(members.length).toBeGreaterThan(0);
            const member = members[0];

            // Step 2: Set member budget
            teamService.setMemberBudget(team.id, member.user_id, 1500).subscribe((updated) => {
              expect(updated.initial_budget).toBe(1500);

              // Step 3: Verify budget updated
              teamService.getMembers(team.id).subscribe((updatedMembers) => {
                const updatedMember = updatedMembers.find((m) => m.user_id === member.user_id);
                expect(updatedMember?.initial_budget).toBe(1500);
                done();
              });
            });
          });
        });
      });
    });
  });

  describe('Team Invitation Flow', () => {
    it('should send bulk invitations', (done) => {
      authService.register('inviter@example.com', 'Inviter', 'password123').subscribe(() => {
        teamService.createTeam('Invite Team', 3000).subscribe((team) => {
          const emails = ['newmember1@example.com', 'newmember2@example.com'];

          // Step 1: Send invitations
          teamService.sendBulkInvitations(team.id, emails).subscribe(
            (result) => {
              expect(result).toBeTruthy();
              expect(result.team_id).toBe(team.id);

              // Step 2: Verify invitations were sent
              expect(result.invited_emails || result.failed_emails !== undefined).toBe(true);
              done();
            }
          );
        });
      });
    });

    it('should handle mixed invitation results', (done) => {
      authService.register('mixeduser@example.com', 'Mixed User', 'password123').subscribe(() => {
        teamService.createTeam('Mixed Invite Team', 2000).subscribe((team) => {
          // First register an existing user
          authService.register('existingmember@example.com', 'Existing', 'password123').subscribe(() => {
            authService.logout();
            authService.login('mixeduser@example.com', 'password123').subscribe(() => {
              const emails = ['existingmember@example.com', 'newinvitee@example.com'];

              // Send invitations to mix of existing and new users
              teamService.sendBulkInvitations(team.id, emails).subscribe((result) => {
                expect(result).toBeTruthy();
                // Result should show both added existing users and new invitations
                done();
              });
            });
          });
        });
      });
    });
  });

  describe('Authorization in Team Operations', () => {
    it('should deny non-creator updates', (done) => {
      // Creator creates team
      authService.register('auth-creator@example.com', 'Auth Creator', 'password123').subscribe(() => {
        teamService.createTeam('Auth Team', 1000).subscribe((team) => {
          const teamId = team.id;
          authService.logout();

          // Non-creator attempts update
          authService.register('auth-member@example.com', 'Auth Member', 'password123').subscribe(() => {
            teamService.updateTeam(teamId, 'Hacked Name').subscribe(
              () => {
                fail('Non-creator should not update team');
              },
              (error) => {
                expect(error).toBeTruthy();
                done();
              }
            );
          });
        });
      });
    });

    it('should deny non-creator deletion', (done) => {
      authService.register('delete-creator@example.com', 'Delete Creator', 'password123').subscribe(() => {
        teamService.createTeam('Delete Auth Team', 1000).subscribe((team) => {
          const teamId = team.id;
          authService.logout();

          authService.register('delete-member@example.com', 'Delete Member', 'password123').subscribe(() => {
            teamService.deleteTeam(teamId).subscribe(
              () => {
                fail('Non-creator should not delete team');
              },
              (error) => {
                expect(error).toBeTruthy();
                done();
              }
            );
          });
        });
      });
    });
  });
});
