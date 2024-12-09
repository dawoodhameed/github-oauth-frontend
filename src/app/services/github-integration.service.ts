import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { firstValueFrom, catchError } from 'rxjs';

export interface GitHubIntegrationStatus {
  connected: boolean;
  username?: string;
  integrationDate?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class GitHubIntegrationService {
  // Signals for reactive state management
  private _integrationStatus = signal<GitHubIntegrationStatus>({ 
    connected: false 
  });

  private _loading = signal(false);
  private _error = signal<string | null>(null);

  // Public signals for components to consume
  public integrationStatus = this._integrationStatus.asReadonly();
  public loading = this._loading.asReadonly();
  public error = this._error.asReadonly();

  constructor(private http: HttpClient) {}

  async initiateGitHubAuth(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      window.location.href = `${environment.apiUrl}/auth/github`;
    } catch (error) {
      this._error.set('Authentication initiation failed');
      this._loading.set(false);
    }
  }

  async fetchIntegrationStatus(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const status = await firstValueFrom(
        this.http.get<GitHubIntegrationStatus>(
          `${environment.apiUrl}/integration/status`, 
          { withCredentials: true }
        ).pipe(
          catchError(err => {
            this._error.set('Failed to fetch integration status');
            throw err;
          })
        )
      );

      this._integrationStatus.set(status);
    } catch (error) {
      this._error.set('  You are not authenticated!');
    } finally {
      this._loading.set(false);
    }
  }

  async removeIntegration(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      await firstValueFrom(
        this.http.delete(`${environment.apiUrl}/integration/remove`, { 
          withCredentials: true 
        })
      );

      this._integrationStatus.set({ connected: false });
    } catch (error) {
      this._error.set('Failed to remove integration');
    } finally {
      this._loading.set(false);
    }
  }
}