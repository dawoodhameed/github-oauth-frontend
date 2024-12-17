import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';

// Interfaces for type safety
export interface CollectionMetadata {
  name: string;
  totalDocuments: number;
  fields?: string[];
}

export interface DataGridResult {
  data: any[];
  total: number;
  page: number;
  pageSize: number;
  facets?: Record<string, any[]>;
}

export interface FacetItem {
  _id: string;
  count: number;
}

export interface FilterOptions {
  dateRange?: { start?: Date; end?: Date };
  selectedFacets?: Record<string, string>;
  searchTerm?: string;
}

export interface SearchResult {
  [collectionName: string]: any[];
}

@Injectable({
  providedIn: 'root',
})
export class GitHubDataGridService {
  // Signal-based state management
  private _collections = signal<CollectionMetadata[]>([]);
  private _currentCollectionData = signal<DataGridResult>({
    data: [],
    total: 0,
    page: 1,
    pageSize: 100,
  });
  private _loading = signal<boolean>(false);
  private _error = signal<string | null>(null);
  private _facets = signal<Record<string, FacetItem[]>>({});
  private _searchResults = signal<SearchResult | null>(null);

  // Readonly signals for components to consume
  public collections = this._collections.asReadonly();
  public currentCollectionData = this._currentCollectionData.asReadonly();
  public loading = this._loading.asReadonly();
  public error = this._error.asReadonly();
  public facets = this._facets.asReadonly();
  public searchResults = this._searchResults.asReadonly();

  constructor(private http: HttpClient) {}

  /**
   * Fetch available collections
   */
  async fetchCollections(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const collections = await firstValueFrom(
        this.http.get<CollectionMetadata[]>(
          `${environment.apiUrl}/collections`,
          { withCredentials: true }
        )
      );

      this._collections.set(collections);
      console.log('Fetched Collections:', collections);
    } catch (error) {
      this.handleError('Failed to fetch GitHub collections', error);
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Fetch data for a specific collection with advanced filtering
   */
  async fetchCollectionData(
    collectionName: string,
    page: number = 1,
    pageSize: number = 100,
    searchTerm: string = '',
    selectedFacets: Record<string, string> = {},
    dateRange?: { start?: Date; end?: Date }
  ): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const payload = {
        collectionName,
        page,
        pageSize,
        //searchTerm,
        filters: selectedFacets,
        dateRange: dateRange
          ? {
              start: dateRange.start?.toISOString(),
              end: dateRange.end?.toISOString(),
            }
          : undefined,
      };

      const result = await firstValueFrom(
        this.http.post<DataGridResult>(
          `${environment.apiUrl}/collection-data`,
          payload,
          { withCredentials: true }
        )
      );

      this._currentCollectionData.set(result);

      // Update facets if provided
      if (result.facets) {
        this._facets.set(result.facets);
      }

      console.log('Fetched Collection Data:', result);
    } catch (error) {
      this.handleError(
        `Failed to fetch data for collection: ${collectionName}`,
        error
      );
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Search across all collections
   */
  async searchAcrossAllCollections(searchTerm: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    this._searchResults.set(null);
    this._currentCollectionData.set({
      data: [],
      total: 0,
      page: 1,
      pageSize: 100,
    });

    try {
      const result = await firstValueFrom(
        this.http.get<SearchResult>(
          `${environment.apiUrl}/search`,
          {
            params: new HttpParams().set('keyword', searchTerm),
            withCredentials: true,
          }
        )
      );

      this._searchResults.set(result);
      console.log('Search Results:', result);
    } catch (error) {
      this.handleError('Search across collections failed', error);
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Fetch detailed relationships for a specific item
   */
  async getItemRelationships(
    collectionName: string,
    itemId: string
  ): Promise<any> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const result = await firstValueFrom(
        this.http.get(
          `${environment.apiUrl}/relationships/${collectionName}/${itemId}`,
          { withCredentials: true }
        )
      );
      return result;
    } catch (error) {
      this.handleError('Failed to fetch item relationships', error);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Export data based on current filters
   */
  async exportData(
    collectionName: string,
    exportFormat: 'csv' | 'json' | 'excel' = 'csv',
    filterOptions?: FilterOptions
  ): Promise<Blob> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const payload = {
        collectionName,
        exportFormat,
        ...filterOptions,
      };

      const response = await firstValueFrom(
        this.http.post(`${environment.apiUrl}/export-data`, payload, {
          withCredentials: true,
          responseType: 'blob',
        })
      );

      return response;
    } catch (error) {
      this.handleError('Data export failed', error);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Reset all filters and state
   */
  resetFilters(): void {
    this._currentCollectionData.set({
      data: [],
      total: 0,
      page: 1,
      pageSize: 100,
    });
    this._facets.set({});
  }

  /**
   * Internal error handling method
   */
  private handleError(message: string, error: any): void {
    console.error(message, error);
    this._error.set(message);
    this._loading.set(false);
  }

  /**
   * Convenience methods for filter management
   */
  setSearchTerm(term: string): void {
    // Implement search term setting logic
  }

  setDateRange(start?: Date, end?: Date): void {
    // Implement date range setting logic
  }

  setFacetFilter(facetKey: string, value: string): void {
    // Implement facet filter setting logic
  }
}
