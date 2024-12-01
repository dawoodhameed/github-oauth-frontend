import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { firstValueFrom, catchError } from 'rxjs';

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  stargazers_count: number;
  language?: string;
  private: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class GitHubRepositoryService {
  private _publicRepos = signal<GitHubRepo[]>([]);
  private _loading = signal(false);
  private _error = signal<string | null>(null);

  public publicRepos = this._publicRepos.asReadonly();
  public loading = this._loading.asReadonly();
  public error = this._error.asReadonly();

  constructor(private http: HttpClient) {}

  async fetchPublicRepositories(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const repos = await firstValueFrom(
        this.http
          .get<GitHubRepo[]>(`${environment.apiUrl}/integration/public-repos`, {
            withCredentials: true,
          })
          .pipe(
            catchError((err) => {
              this._error.set('Failed to fetch repositories');
              throw err;
            })
          )
      );

      this._publicRepos.set(repos);
    } catch (error) {
      this._error.set('Unable to load repositories');
    } finally {
      this._loading.set(false);
    }
  }
}
