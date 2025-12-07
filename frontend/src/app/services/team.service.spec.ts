import { TestBed } from '@angular/core/testing';
import { TeamService } from './team.service';
import { AuthService } from './auth.service';

describe('TeamService', () => {
  let service: TeamService;
  let authService: AuthService;
  let teamId: string;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TeamService);
    authService = TestBed.inject(AuthService);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Team CRUD Operations', () => {
    beforeEach((done) => {
      // Setup: Register and create a team
      authService.register('teamuser@example.com', 'Team User', 'password123').subscribe(
        () => {
          done();
        }
      );
    });

    it('should create a new team', (done) => {
      service.createTeam('Test Team').subscribe(
        (team) => {
          expect(team).toBeTruthy();
          expect(team.id).toBeTruthy();
          expect(team.name).toBe('Test Team');
          teamId = team.id;
          done();
        },
        (error) => {
          fail('Create team should succeed: ' + error);
        }
      );
    });

    it('should create a team with budget', (done) => {
      service.createTeam('Budget Team', 5000).subscribe(
        (team) => {
          expect(team).toBeTruthy();
          expect(team.trip_budget).toBe(5000);
          done();
        },
        (error) => {
          fail('Create team with budget should succeed: ' + error);
        }
      );
    });

    it('should list user teams', (done) => {
      service.createTeam('Team 1').subscribe(() => {
        service.createTeam('Team 2').subscribe(() => {
          service.listTeams().subscribe(
            (teams) => {
              expect(teams).toBeTruthy();
              expect(teams.length).toBeGreaterThanOrEqual(2);
              expect(teams.some((t) => t.name === 'Team 1')).toBe(true);
              expect(teams.some((t) => t.name === 'Team 2')).toBe(true);
              done();
            }
          );
        });
      });
    });

    it('should get single team by id', (done) => {
      service.createTeam('Get Team').subscribe((createdTeam) => {
        service.getTeam(createdTeam.id).subscribe(
          (team) => {
            expect(team).toBeTruthy();
            expect(team.id).toBe(createdTeam.id);
            expect(team.name).toBe('Get Team');
            done();
          }
        );
      });
    });

    it('should update team name and budget', (done) => {
      service.createTeam('Original Name', 1000).subscribe((createdTeam) => {
        service.updateTeam(createdTeam.id, 'Updated Name', 2000).subscribe(
          (team) => {
            expect(team.name).toBe('Updated Name');
            expect(team.trip_budget).toBe(2000);
            done();
          }
        );
      });
    });

    it('should update only team name', (done) => {
      service.createTeam('Name Only', 1000).subscribe((createdTeam) => {
        service.updateTeam(createdTeam.id, 'New Name').subscribe(
          (team) => {
            expect(team.name).toBe('New Name');
            expect(team.trip_budget).toBe(1000);
            done();
          }
        );
      });
    });

    it('should update only team budget', (done) => {
      service.createTeam('Budget Only', 1000).subscribe((createdTeam) => {
        service.updateTeam(createdTeam.id, undefined, 3000).subscribe(
          (team) => {
            expect(team.name).toBe('Budget Only');
            expect(team.trip_budget).toBe(3000);
            done();
          }
        );
      });
    });

    it('should delete team', (done) => {
      service.createTeam('Delete Team').subscribe((createdTeam) => {
        service.deleteTeam(createdTeam.id).subscribe(
          (response) => {
            expect(response).toBeTruthy();
            expect(response.message).toContain('deleted successfully');
            done();
          }
        );
      });
    });
  });

  describe('Team Members', () => {
    let testTeamId: string;

    beforeEach((done) => {
      authService.register('memberuser@example.com', 'Member User', 'password123').subscribe(() => {
        service.createTeam('Member Team').subscribe((team) => {
          testTeamId = team.id;
          done();
        });
      });
    });

    it('should get team members', (done) => {
      service.getMembers(testTeamId).subscribe(
        (members) => {
          expect(members).toBeTruthy();
          expect(Array.isArray(members)).toBe(true);
          done();
        }
      );
    });

    it('should set member budget', (done) => {
      service.getMembers(testTeamId).subscribe((members) => {
        if (members.length > 0) {
          const member = members[0];
          service.setMemberBudget(testTeamId, member.user_id, 1500).subscribe(
            (updatedMember) => {
              expect(updatedMember.initial_budget).toBe(1500);
              done();
            }
          );
        } else {
          fail('No members found in team');
        }
      });
    });
  });

  describe('Team Invitations', () => {
    let testTeamId: string;

    beforeEach((done) => {
      authService.register('inviteuser@example.com', 'Invite User', 'password123').subscribe(() => {
        service.createTeam('Invite Team').subscribe((team) => {
          testTeamId = team.id;
          done();
        });
      });
    });

    it('should send bulk invitations', (done) => {
      const emails = ['invited1@example.com', 'invited2@example.com'];
      service.sendBulkInvitations(testTeamId, emails).subscribe(
        (result) => {
          expect(result).toBeTruthy();
          expect(result.team_id).toBe(testTeamId);
          done();
        },
        (error) => {
          fail('Send bulk invitations should succeed: ' + error);
        }
      );
    });

    it('should handle invitation to existing user', (done) => {
      // First register a user
      authService.register('existing@example.com', 'Existing User', 'password123').subscribe(() => {
        service.sendBulkInvitations(testTeamId, ['existing@example.com']).subscribe(
          (result) => {
            expect(result).toBeTruthy();
            // Should add existing user directly
            expect(result.added_existing_users).toContain('existing@example.com');
            done();
          }
        );
      });
    });

    it('should handle multiple invitations with mixed results', (done) => {
      authService.register('mixed1@example.com', 'Mixed User 1', 'password123').subscribe(() => {
        const emails = ['mixed1@example.com', 'newuser@example.com'];
        service.sendBulkInvitations(testTeamId, emails).subscribe(
          (result) => {
            expect(result).toBeTruthy();
            expect(result.invited_emails || result.added_existing_users).toBeTruthy();
            done();
          }
        );
      });
    });
  });

  describe('Authorization', () => {
    let creator: { email: string; password: string };
    let nonCreator: { email: string; password: string };
    let createdTeamId: string;

    beforeEach((done) => {
      creator = { email: 'creator@example.com', password: 'password123' };
      nonCreator = { email: 'noncreator@example.com', password: 'password123' };

      authService.register(creator.email, 'Creator User', creator.password).subscribe(() => {
        service.createTeam('Auth Team').subscribe((team) => {
          createdTeamId = team.id;
          authService.register(nonCreator.email, 'Non Creator User', nonCreator.password).subscribe(() => {
            done();
          });
        });
      });
    });

    it('should allow creator to update team', (done) => {
      service.updateTeam(createdTeamId, 'Updated by Creator').subscribe(
        (team) => {
          expect(team.name).toBe('Updated by Creator');
          done();
        }
      );
    });

    it('should deny non-creator from updating team', (done) => {
      // Login as non-creator
      authService.logout();
      authService.login(nonCreator.email, nonCreator.password).subscribe(() => {
        service.updateTeam(createdTeamId, 'Hacked Name').subscribe(
          () => {
            fail('Non-creator should not be able to update team');
          },
          (error) => {
            expect(error).toBeTruthy();
            done();
          }
        );
      });
    });

    it('should deny non-creator from deleting team', (done) => {
      authService.logout();
      authService.login(nonCreator.email, nonCreator.password).subscribe(() => {
        service.deleteTeam(createdTeamId).subscribe(
          () => {
            fail('Non-creator should not be able to delete team');
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
