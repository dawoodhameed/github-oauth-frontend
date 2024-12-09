import { Component, inject, OnInit } from '@angular/core';
import { GitHubIntegrationService } from './../services/github-integration.service';
import {
  GitHubRepositoryService,
  Repository,
} from './../services/github-repo.service';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { AgGridModule } from 'ag-grid-angular';
import { ColDef, GridReadyEvent } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

interface RepositoryStats {
  repoName: string;
  organization: string;
  userStats: Array<{
    user: string;
    totalCommits: number;
    totalPullRequests: number;
    totalIssues: number;
  }>;
}

@Component({
  standalone: true,
  selector: 'app-github-integration',
  imports: [
    DatePipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    FormsModule,
    AgGridModule,
  ],
  template: `
    <mat-card class="integration-card">
      @if (service.loading()) {
      <mat-card-content>
        <mat-spinner></mat-spinner>
      </mat-card-content>
      } @else if (service.integrationStatus().connected) {
      <mat-card-content>
        <div class="connected-status">
          <p>
            <mat-icon color="primary">sync</mat-icon>
            Synced on:
            {{ service.integrationStatus().integrationDate | date : 'medium' }}
          </p>
          <p>Username: {{ service.integrationStatus().username }}</p>

          <button mat-raised-button color="warn" (click)="removeIntegration()">
            Disconnect GitHub
          </button>
        </div>

        <div class="repositories-section">
          <h2>Gitbub Projects</h2>
          <p>
            Specify which projects we should pull from when synchronizing data
            into Sred.io.
          </p>

          @if (repoService.loading()) {
          <mat-spinner></mat-spinner>
          } @else {
          <ag-grid-angular
            class="ag-theme-alpine"
            [rowData]="repositoriesGridData"
            [columnDefs]="repositoriesColumnDefs"
            [defaultColDef]="defaultColDef"
            (gridReady)="onGridReady($event)"
            style="height: 400px; width: 100%;"
          ></ag-grid-angular>
          } @for (repoStats of selectedRepositoriesStats; track
          repoStats.repoName) {
          <mat-card class="stats-card">
            <mat-card-title>
              User Stats for {{ repoStats.repoName }} ({{
                repoStats.organization
              }})
            </mat-card-title>
            <mat-card-content>
              <ag-grid-angular
                class="ag-theme-alpine"
                [rowData]="repoStats.userStats"
                [columnDefs]="userStatsColumnDefs"
                [defaultColDef]="defaultColDef"
                (gridReady)="onGridReady($event)"
                style="height: 400px; width: 100%;"
              ></ag-grid-angular>
            </mat-card-content>
          </mat-card>
          }
        </div>
      </mat-card-content>
      } @else {
      <mat-card-content>
        <div class="connect-container">
          <button mat-raised-button color="primary" (click)="connectToGitHub()">
            <mat-icon>link</mat-icon> Connect to GitHub
          </button>
        </div>
      </mat-card-content>
      } @if (service.error()) {
      <mat-card-footer>
        {{ service.error() }}
      </mat-card-footer>
      }
    </mat-card>
  `,
  styles: [
    `
      h2 {
        color: blue;
      }

      .integration-card {
        max-width: 1200px;
        margin: 20px auto;
      }

      .connected-status {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: 20px;
      }

      .github-logo {
        height: 50px;
        margin-bottom: 10px;
      }

      .github-logo-large {
        height: 100px;
        margin-bottom: 20px;
      }

      .connect-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }

      .repositories-section {
        margin-top: 20px;
      }

      .stats-card {
        margin-top: 20px;
      }

      .ag-theme-alpine {
        height: 400px;
        width: 100%;
      }
    `,
  ],
})
export class GitHubIntegrationComponent implements OnInit {
  service = inject(GitHubIntegrationService);
  repoService = inject(GitHubRepositoryService);
  private readonly snackBar = inject(MatSnackBar);

  // AG Grid column definitions for repositories
  repositoriesColumnDefs: ColDef[] = [
    {
      headerName: 'Organization',
      field: 'organization',
      sortable: true,
      filter: true,
      
    },
    {
      headerName: 'Repository Name',
      field: 'name',
      sortable: true,
      filter: true,
    },
    {
      headerName: 'Link',
      field: 'html_url',
      sortable: true,
      filter: false,
      cellRenderer: (params: any) => {
        return `<a href="${params.data.html_url}" target="_blank">${params.value}</a>`;
      },
    },
    {
      headerName: 'Slug',
      field: 'slug',
      sortable: true,
      filter: true,
    },
    {
      headerName: 'Stars',
      field: 'stargazers_count',
      sortable: true,
      filter: true,
    },
    {
      headerName: 'Included',
      field: 'included',
      sortable: true,
      cellRenderer: 'agCheckboxCellRenderer',
      cellRendererParams: {
        disabled: false,
      },
      cellStyle: { textAlign: 'center' },
      onCellValueChanged: (params: any) => {
        this.onRepositoryToggle(params.data);
      },
    },
  ];

  // AG Grid column definitions for user stats
  userStatsColumnDefs: ColDef[] = [
    {
      headerName: 'Username',
      field: 'user',
      sortable: true,
      filter: true,
    },
    {
      headerName: 'Total Commits',
      field: 'totalCommits',
      sortable: true,
      filter: true,
    },
    {
      headerName: 'Total Pull Requests',
      field: 'totalPullRequests',
      sortable: true,
      filter: true,
    },
    {
      headerName: 'Total Issues',
      field: 'totalIssues',
      sortable: true,
      filter: true,
    },
  ];

  // Default column definitions
  defaultColDef: ColDef = {
    flex: 1,
    minWidth: 100,
    resizable: true,
  };

  // Grid data for repositories
  repositoriesGridData: any[] = [];

  // Holds the stats for selected repositories
  selectedRepositoriesStats: RepositoryStats[] = [];

  ngOnInit() {
    this.service.fetchIntegrationStatus();

    // Fetch public repositories
    console.log(
      'Integration Status: ',
      this.service.integrationStatus().connected
    );
    if (this.service.integrationStatus().connected) {
      this.fetchRepositories();
    }
  }

  fetchRepositories() {
    this.repoService.fetchOrganizationsAndRepos().then(() => {
      // Transform repositories for AG Grid
      this.repositoriesGridData = this.repoService
        .publicRepos()
        .map((repo) => ({
          ...repo,
          organization: repo.organization,
        }));
    });
  }

  connectToGitHub() {
    this.service
      .initiateGitHubAuth()
      .then(() => {
        // Explicitly fetch repositories after authentication
        this.fetchRepositories();
      })
      .catch((error) => {
        console.error('GitHub authentication failed', error);
        this.snackBar.open('GitHub authentication failed', 'Close', {
          duration: 3000,
        });
      });
  }

  async removeIntegration() {
    await this.service.removeIntegration();
    this.snackBar.open('GitHub integration removed', 'Close', {
      duration: 3000,
    });
  }

  onRepositoryToggle(repo: Repository) {
    if (repo.included) {
      // Fetch user stats for the repository
      this.fetchRepositoryUserStats(repo);
    } else {
      // Remove stats for the unchecked repository
      this.selectedRepositoriesStats = this.selectedRepositoriesStats.filter(
        (stats) => stats.repoName !== repo.name
      );
    }
  }

  // Grid ready event handler
  onGridReady(params: GridReadyEvent) {
    params.api.sizeColumnsToFit();
  }

  private async fetchRepositoryUserStats(repo: Repository) {
    await this.repoService
      .fetchRepositoryUserStats(repo.organization, repo.name)
      .then(() => {
        const repoStats: RepositoryStats = this.repoService.userStats();

        // Check if repository stats already exist
        const existingIndex = this.selectedRepositoriesStats.findIndex(
          (stats) => stats.repoName === repo.name
        );

        if (existingIndex !== -1) {
          // Update existing stats
          this.selectedRepositoriesStats[existingIndex] = repoStats;
        } else {
          // Add new repository stats
          this.selectedRepositoriesStats.push(repoStats);
        }
      });
  }
}
