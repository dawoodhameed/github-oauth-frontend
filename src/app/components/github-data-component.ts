import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Angular Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatMenuModule } from '@angular/material/menu';

// AG Grid Imports
import { AgGridModule } from 'ag-grid-angular';
import { 
  ColDef, 
  GridReadyEvent, 
  GridApi, 
  Column, 
  CellClickedEvent,
  RowDragEndEvent 
} from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import 'ag-grid-enterprise';

// Services and Interfaces
import { 
  GitHubDataGridService, 
  CollectionMetadata, 
  DataGridResult 
} from '../services/github-data.service';

@Component({
  selector: 'app-github-data-grid',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    AgGridModule,
    MatMenuModule
  ],
  template: `
    <mat-card class="github-data-grid-container">
      <!-- Loading State -->
      @if (service.loading()) {
        <mat-card-content class="loading-container">
          <mat-spinner></mat-spinner>
        </mat-card-content>
      }

      <!-- Error State -->
      @if (service.error()) {
        <mat-card-footer class="error-container">
          <p>{{ service.error() }}</p>
        </mat-card-footer>
      }

      <!-- Main Grid Content -->
      @if (!service.loading()) {
        <mat-card-content>
          <!-- Collection Selector -->
          <div class="grid-controls">
            <mat-form-field>
              <mat-label>Select Collection</mat-label>
              <mat-select 
                [(value)]="selectedCollection" 
                (selectionChange)="onCollectionChange()"
              >
                @for (collection of service.collections(); track collection.name) {
                  <mat-option [value]="collection.name">
                    {{ collection.name }} ({{ collection.totalDocuments }})
                  </mat-option>
                }
              </mat-select>
            </mat-form-field>

            <!-- Global Search -->
            <mat-form-field>
              <input 
                matInput 
                placeholder="Global Search" 
                [(ngModel)]="searchTerm" 
                (input)="onSearchChange()"
              >
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>
          </div>

          <!-- Filters Section -->
          <div class="filters-container">
            <!-- Date Range Filter -->
            <mat-form-field>
              <mat-label>Date Range</mat-label>
              <mat-date-range-input [rangePicker]="picker">
                <input 
                  matStartDate 
                  placeholder="Start date" 
                  [(ngModel)]="dateRange.start"
                  (dateChange)="applyFilters()"
                >
                <input 
                  matEndDate 
                  placeholder="End date" 
                  [(ngModel)]="dateRange.end"
                  (dateChange)="applyFilters()"
                >
              </mat-date-range-input>
              <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
              <mat-date-range-picker #picker></mat-date-range-picker>
            </mat-form-field>

            <!-- Dynamic Facet Filters -->
            @for (facet of getFacetKeys(); track facet) {
              <mat-form-field>
                <mat-label>Filter by {{ facet }}</mat-label>
                <mat-select 
                  [(ngModel)]="selectedFacets[facet]"
                  (selectionChange)="applyFilters()"
                >
                  @for (option of service.facets()[facet]; track option._id) {
                    <mat-option [value]="option._id">
                      {{ option._id }} ({{ option.count }})
                    </mat-option>
                  }
                </mat-select>
              </mat-form-field>
            }
          </div>

          <!-- AG Grid -->
          <ag-grid-angular
            class="ag-theme-alpine"
            [rowData]="gridData"
            [columnDefs]="columnDefinitions"
            [defaultColDef]="defaultColumnDefinition"
            [masterDetail]="true"
            [detailCellRenderer]="detailCellRenderer"
            [detailRowHeight]="200"
            (gridReady)="onGridReady($event)"
            (cellClicked)="onCellClicked($event)"
            (rowDragEnd)="onRowDragEnd($event)"
            style="height: 500px; width: 100%;"
          ></ag-grid-angular>
          <mat-menu #cellMenu="matMenu">
            <button mat-menu-item>{{ clickedCellData | json }}</button>
          </mat-menu>
          <!-- Pagination -->
          <div class="pagination">
            <button 
              mat-raised-button 
              (click)="loadPreviousPage()" 
              [disabled]="currentPage === 1"
            >
              Previous
            </button>
            <span>
              Page {{ currentPage }} of 
              {{ totalPages }}
            </span>
            <button 
              mat-raised-button 
              (click)="loadNextPage()" 
              [disabled]="currentPage >= totalPages"
            >
              Next
            </button>
          </div>
        </mat-card-content>
      }
    </mat-card>
  `,
  styles: [`
    .github-data-grid-container {
      max-width: 1200px;
      margin: 20px auto;
    }
    .grid-controls, .filters-container {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
      margin-bottom: 15px;
    }
    .loading-container, .error-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 300px;
    }
    .pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 15px;
    }
    .ag-theme-alpine .ag-row {
      cursor: move;
    }
  `]
})
export class GitHubDataGridComponent implements OnInit {
  // Service Injections
  service = inject(GitHubDataGridService);
  private snackBar = inject(MatSnackBar);

  // Component State
  selectedCollection: string = '';
  searchTerm: string = '';
  currentPage: number = 1;
  pageSize: number = 100;
  totalPages: number = 0;
  clickedCellData: any;
  
  // Filtering
  dateRange = { start: undefined, end: undefined };
  selectedFacets: { [key: string]: string } = {};

  // Grid Properties
  gridData: any[] = [];
  columnDefinitions: ColDef[] = [];
  defaultColumnDefinition: ColDef = {
    flex: 1,
    minWidth: 100,
    resizable: true,
    sortable: true,
    filter: true,
    cellRenderer: 'agGroupCellRenderer',
    rowDrag: true,
  };

  // Grid API References
  private gridApi!: GridApi;
  private columnApi!: Column;

  ngOnInit() {
    this.fetchCollectionsAndInitializeGrid();
  }

  fetchCollectionsAndInitializeGrid() {
    this.service.fetchCollections().then(() => {
      if (this.service.collections().length > 0) {
        this.selectedCollection = this.service.collections()[0].name;
        this.loadCollectionData();
      }
    });
  }

  loadCollectionData() {
    this.service.fetchCollectionData(
      this.selectedCollection,
      this.currentPage,
      this.pageSize,
      this.searchTerm,
      this.selectedFacets,
      this.dateRange
    ).then(() => {
      const data = this.service.currentCollectionData();
      this.gridData = data.data;
      this.totalPages = Math.ceil(data.total / this.pageSize);

      // Dynamically generate columns if data exists
      if (this.gridData.length > 0) {
        this.columnDefinitions = this.generateColumnDefinitions(this.gridData[0]);
      }
    });
  }

  // Utility method to get facet keys for rendering
  getFacetKeys(): string[] {
    return Object.keys(this.service.facets() || {});
  }

  onCollectionChange() {
    this.currentPage = 1;
    this.loadCollectionData();
  }

  onSearchChange() {
    this.currentPage = 1;
    this.loadCollectionData();
  }

  applyFilters() {
    this.currentPage = 1;
    this.loadCollectionData();
  }

  loadPreviousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadCollectionData();
    }
  }

  loadNextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadCollectionData();
    }
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
    //this.columnApi = params.columnApi;
    params.api.sizeColumnsToFit();
  }

  onCellClicked(event: CellClickedEvent) {
    // Implement cell click logic, e.g., show details
    console.log('Cell clicked', event);
    this.clickedCellData = event.data;
    this.snackBar.openFromComponent(MatMenuModule, {
      data: { menu: 'cellMenu' },
      duration: 2000,
    });
  }

  // Detail cell renderer for expanded rows
  detailCellRenderer = (params: any) => {
    const container = document.createElement('div');
    container.innerHTML = `
      <h3>Related Data</h3>
      <pre>${JSON.stringify(params.data, null, 2)}</pre>
    `;
    return container;
  };

  // Column generation with nested object support
  private generateColumnDefinitions(dataObject: any): ColDef[] {
    const flattenObject = (obj: any, prefix = ''): ColDef[] => {
      return Object.keys(obj).flatMap((key) => {
        const path = prefix ? `${prefix}.${key}` : key;

        if (typeof obj[key] === 'object' && obj[key] !== null) {
          return flattenObject(obj[key], path);
        }

        return [{
          headerName: this.formatHeaderName(path),
          field: path,
          sortable: true,
          filter: true,
          resizable: true,
        }];
      });
    };

    return flattenObject(dataObject);
  }

  // Utility method to format header names
  private formatHeaderName(key: string): string {
    return key
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  onRowDragEnd(event: RowDragEndEvent) {
    const movingData = event.node.data;
    const overNode = event.overNode;
    const overData = overNode?.data;
    const fromIndex = this.gridData.indexOf(movingData);
    const toIndex = this.gridData.indexOf(overData);

    this.gridData.splice(fromIndex, 1);
    this.gridData.splice(toIndex, 0, movingData);

    this.gridApi.applyTransaction({ update: this.gridData });
  }
}