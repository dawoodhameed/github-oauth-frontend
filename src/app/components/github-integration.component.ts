import { Component, inject, OnInit } from '@angular/core';
import { GitHubIntegrationService } from './../services/github-integration.service';
import { GitHubRepositoryService } from './../services/github-repo.service';
import { NgIf, DatePipe, NgFor } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';

@Component({
  standalone: true,
  selector: 'app-github-integration',
  imports: [
    NgIf,
    NgFor,
    DatePipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatListModule,
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
          <mat-icon color="primary">check_circle</mat-icon>
          <p>
            Connected on:
            {{ service.integrationStatus().integrationDate | date }}
          </p>
          <p>Username: {{ service.integrationStatus().username }}</p>

          <button mat-raised-button color="warn" (click)="removeIntegration()">
            Remove Integration
          </button>
        </div>

        <div class="repositories-section">
          <h2>Public Repositories</h2>

          @if (repoService.loading()) {
          <mat-spinner></mat-spinner>
          } @else if (repoService.publicRepos().length > 0) {
          <mat-list>
            @for (repo of repoService.publicRepos(); track repo.id) {
            <mat-list-item>
              <a [href]="repo.html_url" target="_blank">
                {{ repo.name }}
              </a>
              <span class="repo-details">
                {{ repo.description || 'No description' }}
                <span class="language-badge">
                  {{ repo.language || 'N/A' }}
                </span>
                <span class="stars"> ⭐ {{ repo.stargazers_count }} </span>
              </span>
            </mat-list-item>
            }
          </mat-list>
          } @else {
          <p>No public repositories found.</p>
          }
        </div>
      </mat-card-content>
      } @else {
      <mat-card-content>
        <button mat-raised-button color="primary" (click)="connectToGitHub()">
          Connect to GitHub
        </button>
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
      .integration-card {
        max-width: 600px;
        margin: 20px auto;
      }
      .connected-status {
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .repositories-section {
        margin-top: 20px;
      }
      .repo-details {
        display: flex;
        gap: 10px;
        align-items: center;
        color: #666;
      }
      .language-badge {
        background-color: #f0f0f0;
        padding: 2px 5px;
        border-radius: 4px;
      }
      .stars {
        margin-left: 10px;
      }
    `,
  ],
})
export class GitHubIntegrationComponent implements OnInit {
  service = inject(GitHubIntegrationService);
  repoService = inject(GitHubRepositoryService);
  private snackBar = inject(MatSnackBar);

  ngOnInit() {
    this.service.fetchIntegrationStatus();
  }

  connectToGitHub() {
    this.service.initiateGitHubAuth();
  }

  async removeIntegration() {
    await this.service.removeIntegration();
    this.snackBar.open('GitHub integration removed', 'Close', {
      duration: 3000,
    });
  }
}
