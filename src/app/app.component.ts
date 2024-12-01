// src/app/app.component.ts
import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet, 
    RouterLink, 
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule
  ],
  template: `
    <mat-toolbar color="primary">
      <nav>
        <a mat-button routerLink="/" routerLinkActive="active">Home</a>
        <a mat-button routerLink="/dashboard" routerLinkActive="active">Dashboard</a>
        <a mat-button routerLink="/github-integration" routerLinkActive="active">GitHub Integration</a>
      </nav>
    </mat-toolbar>
    
    <router-outlet></router-outlet>
  `,
  styles: [`
    mat-toolbar {
      display: flex;
      justify-content: start;
      gap: 10px;
    }
    .active {
      background-color: rgba(255,255,255,0.2);
    }
  `]
})
export class AppComponent {
  title = 'GitHub Integration App';
}