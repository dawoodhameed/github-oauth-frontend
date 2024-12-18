// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { GitHubIntegrationComponent } from '../app/components/github-integration.component';
import { GitHubDataGridComponent } from '../app/components/github-data-component';
import { IssueDetailsComponent } from '../app/components/issue-details.component';
import { HomeComponent } from '../app/components/home.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    title: 'Home',
  },
  {
    path: 'github-integration',
    component: GitHubIntegrationComponent,
    title: 'GitHub Integration',
  },
  {
    path: 'github-data',
    component: GitHubDataGridComponent,
    title: 'GitHub Integration',
  },
  {
    path: 'github-issue-details',
    component: IssueDetailsComponent,
    title: 'GitHub Issue Details',
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];
