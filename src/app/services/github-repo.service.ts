import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { firstValueFrom, catchError } from 'rxjs';

export interface Organization {
  id: number;
  login: string;
  name: string;
  repositories: Repository[];
}

export interface Repository {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  included: boolean;
  organization: string;
}

export interface UserStats {
  user: string;
  totalCommits: number;
  totalPullRequests: number;
  totalIssues: number;
}

export interface RepositoryDetails {
  commits: any[];
  pullRequests: any[];
  issues: any[];
  userStats: UserStats[];
}

@Injectable({
  providedIn: 'root',
})
export class GitHubRepositoryService {
  private _organizations = signal<Organization[]>([]);
  private _userStats = signal<{
    repoName: string;
    organization: string;
    userStats: Array<{
      user: string;
      totalCommits: number;
      totalPullRequests: number;
      totalIssues: number;
    }>;
  }>({ repoName: '', userStats: [], organization: '' });
  private _publicRepos = signal<Repository[]>([]);
  private _repositoryDetails = signal<RepositoryDetails | null>(null);
  private _loading = signal(false);
  private _error = signal<string | null>(null);

  public organizations = this._organizations.asReadonly();
  public userStats = this._userStats.asReadonly();
  public publicRepos = this._publicRepos.asReadonly();
  public repositoryDetails = this._repositoryDetails.asReadonly();
  public loading = this._loading.asReadonly();
  public error = this._error.asReadonly();

  constructor(private http: HttpClient) {}

  async fetchOrganizationsAndRepos(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const organizations = await firstValueFrom(
        this.http.get<Organization[]>(`${environment.apiUrl}/organizations`, {
          withCredentials: true,
        })
      );

      this._organizations.set(organizations);

      // Flatten repositories for easy access
      const repos: Repository[] = organizations.flatMap((org) =>
        org.repositories.map((repo) => ({ ...repo, organization: org.login }))
      );
      this._publicRepos.set(repos);
    } catch (error) {
      this._error.set('Failed to fetch organizations and repositories');
    } finally {
      this._loading.set(false);
    }
  }

  async fetchRepositoryUserStats(org: string, repoName: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const userStats = await firstValueFrom(
        this.http.post<{
          repoName: string;
          organization: string;
          userStats: Array<{
            user: string;
            totalCommits: number;
            totalPullRequests: number;
            totalIssues: number;
          }>;
        }>(
          `${environment.apiUrl}/stats/`,
          { org, repoName },
          {
            withCredentials: true,
          }
        )
      );

      this._userStats.set(userStats);
    } catch (error) {
      this._error.set('Failed to fetch organizations and repositories');
    } finally {
      this._loading.set(false);
    }
  }

  async fetchRepositoryDetails(repo: Repository): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const details = await firstValueFrom(
        this.http.post<RepositoryDetails>(
          `${environment.apiUrl}/github/repo-details`,
          {
            repoFullName: repo.name,
            organization: repo.organization,
          },
          { withCredentials: true }
        )
      );

      this._repositoryDetails.set(details);
    } catch (error) {
      this._error.set('Failed to fetch repository details');
    } finally {
      this._loading.set(false);
    }
  }

  toggleRepositoryInclusion(repo: Repository): void {
    const organizations = this._organizations().map((org) => {
      return {
        ...org,
        repositories: org.repositories.map((r) =>
          r.id === repo.id ? { ...r, included: !r.included } : r
        ),
      };
    });

    this._organizations.set(organizations);
  }
}
