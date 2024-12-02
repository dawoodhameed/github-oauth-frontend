import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Organization {
  _id: string;
  name: string;
  githubId: string;
}

export interface Repository {
  _id: string;
  name: string;
  githubId: string;
  organizationId: string;
  included: boolean;
  commits?: number;
  pullRequests?: number;
  issues?: number;
}

export interface UserStats {
  userId: string;
  totalCommits: number;
  totalPullRequests: number;
  totalIssues: number;
}

@Injectable({
  providedIn: 'root'
})
export class GithubService {
  private apiUrl = '/api/github'; // Update with your backend URL

  constructor(private http: HttpClient) {}

  fetchOrganizations(): Observable<Organization[]> {
    return this.http.get<Organization[]>(`${this.apiUrl}/organizations`);
  }

  fetchRepositories(): Observable<Repository[]> {
    return this.http.get<Repository[]>(`${this.apiUrl}/repositories`);
  }

  updateRepositoryInclusion(repoId: string, included: boolean): Observable<Repository> {
    return this.http.patch<Repository>(`${this.apiUrl}/repositories/${repoId}`, { included });
  }

  fetchIncludedRepoData(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/repositories/included-data`);
  }

  getUserStats(): Observable<UserStats> {
    return this.http.get<UserStats>(`${this.apiUrl}/user-stats`);
  }
}