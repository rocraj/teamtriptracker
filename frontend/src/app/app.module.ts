import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// Import pages
import { LoginPageComponent } from './pages/login/login.page';
import { SignupPageComponent } from './pages/signup/signup.page';
import { DashboardPageComponent } from './pages/dashboard/dashboard.page';
import { TeamsPageComponent } from './pages/teams/teams.page';
import { TeamDetailPageComponent } from './pages/team-detail/team-detail.page';
import { SettingsPageComponent } from './pages/settings/settings.page';
import { InviteAcceptPageComponent } from './pages/invite-accept/invite-accept.page';

// Import shared components
import { HeaderComponent } from './components/shared/header.component';
import { ButtonComponent } from './components/shared/button.component';
import { LoadingComponent } from './components/shared/loading.component';
import { AlertComponent } from './components/shared/alert.component';
import { CreateTeamModalComponent } from './components/shared/create-team-modal.component';
import { AddTeamMemberModalComponent } from './components/shared/add-team-member-modal.component';
import { InviteMembersModalComponent } from './components/shared/invite-members-modal.component';

// Import form components
import { InputFieldComponent } from './components/form/input-field.component';
import { SelectFieldComponent } from './components/form/select-field.component';

// Import card components
import { TeamCardComponent } from './components/cards/team-card.component';
import { ExpenseCardComponent } from './components/cards/expense-card.component';

@NgModule({
  declarations: [
    AppComponent,
    // Pages
    LoginPageComponent,
    SignupPageComponent,
    DashboardPageComponent,
    TeamsPageComponent,
    TeamDetailPageComponent,
    SettingsPageComponent,
    InviteAcceptPageComponent,
    // Shared Components
    HeaderComponent,
    ButtonComponent,
    LoadingComponent,
    AlertComponent,
    CreateTeamModalComponent,
    AddTeamMemberModalComponent,
    InviteMembersModalComponent,
    // Form Components
    InputFieldComponent,
    SelectFieldComponent,
    // Card Components
    TeamCardComponent,
    ExpenseCardComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    CommonModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
