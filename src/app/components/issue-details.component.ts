import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { GitHubDataGridService } from '../services/github-data.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-issue-details',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <mat-card *ngIf="service.issueDetails()">
      <mat-card-header>
        <mat-card-title>{{ service.issueDetails()?.issueDetails?.title }}</mat-card-title>
        <mat-card-subtitle>Issue #{{ service.issueDetails()?.issueDetails?.number }}</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <p>{{ service.issueDetails()?.issueDetails?.body }}</p>
        <p><strong>State:</strong> {{ service.issueDetails()?.issueDetails?.state }}</p>
        <p><strong>Created At:</strong> {{ service.issueDetails()?.issueDetails?.created_at | date }}</p>
        <p><strong>Updated At:</strong> {{ service.issueDetails()?.issueDetails?.updated_at | date }}</p>
        <p><strong>Comments:</strong> {{ service.issueDetails()?.issueDetails?.comments }}</p>
      </mat-card-content>
      <mat-card-actions>
        <button mat-button (click)="reloadIssueDetails()">Reload</button>
      </mat-card-actions>
    </mat-card>

    <mat-card *ngIf="(service.issueDetails()?.issueComments?.length ?? 0) > 0">
      <mat-card-header>
        <mat-card-title>Comments</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <div *ngFor="let comment of service.issueDetails()?.issueComments">
          <p><strong>{{ comment.user.login }}</strong> commented at {{ comment.created_at | date }}</p>
          <p>{{ comment.body }}</p>
        </div>
      </mat-card-content>
    </mat-card>

    <mat-card *ngIf="(service.issueDetails()?.issueEvents?.length ?? 0) > 0">
      <mat-card-header>
        <mat-card-title>Events</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <div *ngFor="let event of service.issueDetails()?.issueEvents">
          <p><strong>{{ event.actor.login }}</strong> {{ event.event }} at {{ event.created_at | date }}</p>
        </div>
      </mat-card-content>
    </mat-card>

    <mat-card *ngIf="(service.issueDetails()?.issueTimelines?.length ?? 0) > 0">
      <mat-card-header>
        <mat-card-title>Timelines</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <div *ngFor="let timeline of service.issueDetails()?.issueTimelines">
          <p><strong>{{ timeline.actor.login }}</strong> {{ timeline.event }} at {{ timeline.created_at | date }}</p>
        </div>
      </mat-card-content>
    </mat-card>

    <mat-card *ngIf="(service.issueDetails()?.relatedPRs?.length ?? 0) > 0">
      <mat-card-header>
        <mat-card-title>Related Pull Requests</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <div *ngFor="let pr of service.issueDetails()?.relatedPRs">
          <p><strong>{{ pr.title }}</strong> by {{ pr.user.login }}</p>
          <p><a [href]="pr.html_url" target="_blank">View Pull Request</a></p>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    mat-card {
      margin: 20px;
    }
    mat-card-content p {
      margin: 5px 0;
    }
  `]
})
export class IssueDetailsComponent implements OnInit {
  service = inject(GitHubDataGridService);
  private readonly route = inject(ActivatedRoute);

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const issueNumber = params['issueNumber'];
      const repo = params['repoName'];
      const owner = params['org'];
      if (issueNumber && repo && owner) {
        this.loadIssueDetails(issueNumber, repo, owner);
      }
    });
  }

  reloadIssueDetails() {
    const issueNumber = this.route.snapshot.queryParamMap.get('issueNumber');
    const repo = this.route.snapshot.queryParamMap.get('repoName');
    const owner = this.route.snapshot.queryParamMap.get('org');
    if (issueNumber && repo && owner) {
      this.loadIssueDetails(issueNumber, repo, owner);
    }
  }

  loadIssueDetails(issueNumber: string, repo: string, owner: string) {
    this.service.fetchIssueDetails(issueNumber, repo, owner);
  }
}
