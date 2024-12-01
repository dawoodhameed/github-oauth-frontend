// src/app/features/home/home.component.ts
import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [MatCardModule, RouterLink],
  template: `
    <div class="home-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Welcome to GitHub Integration App</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p>Get started by connecting your GitHub account!</p>
          <a mat-raised-button color="primary" routerLink="/github-integration">
            Go to GitHub Integration
          </a>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .home-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: calc(100vh - 64px);
      padding: 20px;
    }
    mat-card {
      max-width: 400px;
      text-align: center;
    }
  `]
})
export class HomeComponent {}