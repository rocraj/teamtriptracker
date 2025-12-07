import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

// Import pages
import { LoginPageComponent } from './pages/login/login.page';
import { SignupPageComponent } from './pages/signup/signup.page';
import { DashboardPageComponent } from './pages/dashboard/dashboard.page';
import { TeamsPageComponent } from './pages/teams/teams.page';
import { TeamDetailPageComponent } from './pages/team-detail/team-detail.page';
import { SettingsPageComponent } from './pages/settings/settings.page';
import { InviteAcceptPageComponent } from './pages/invite-accept/invite-accept.page';

const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'login', component: LoginPageComponent },
  { path: 'signup', component: SignupPageComponent },
  { path: 'invite/:token', component: InviteAcceptPageComponent },
  {
    path: 'dashboard',
    component: DashboardPageComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'teams',
    component: TeamsPageComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'teams/:id',
    component: TeamDetailPageComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'settings',
    component: SettingsPageComponent,
    canActivate: [AuthGuard]
  },
  { path: '**', redirectTo: '/dashboard' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
