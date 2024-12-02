// src/app/components/github-organizations/github-organizations.component.ts
import { Component, OnInit, ViewChild } from '@angular/core';
import { GithubService, Organization, Repository } from '../services/github-organization.service';
import { ColDef, GridReadyEvent } from 'ag-grid-community';
import { AgGridAngular } from 'ag-grid-angular';

@Component({
  selector: 'app-github-organizations',
  template: `
    <div class="container">
      <h2>GitHub Organizations and Repositories</h2>
      
      <button mat-raised-button color="primary" (click)="fetchOrganizations()">
        Fetch Organizations
      </button>
      
      <ag-grid-angular
        #organizationsGrid
        style="width: 100%; height: 500px;"
        [rowData]="repositories"
        [columnDefs]="columnDefs"
        [defaultColDef]="defaultColDef"
        (gridReady)="onGridReady($event)"
        class="ag-theme-alpine"
      >
      </ag-grid-angular>
    </div>
  `
})
export class GithubOrganizationsComponent implements OnInit {
  @ViewChild('organizationsGrid') grid: AgGridAngular;

  organizations: Organization[] = [];
  repositories: Repository[] = [];
  
  columnDefs: ColDef[] = [
    { 
      headerName: 'Repository Name', 
      field: 'name', 
      sortable: true, 
      filter: true 
    },
    { 
      headerName: 'Organization', 
      valueGetter: (params) => {
        const org = this.organizations.find(
          o => o._id === params.data.organizationId
        );
        return org ? org.name : 'Unknown';
      },
      sortable: true, 
      filter: true 
    },
    { 
      headerName: 'Included', 
      field: 'included', 
      cellRenderer: 'agCheckboxCellRenderer',
      cellEditor: 'agCheckboxCellEditor',
      editable: true,
      onCellValueChanged: this.onInclusionChanged.bind(this)
    }
  ];

  defaultColDef: ColDef = {
    resizable: true,
    sortable: true,
    filter: true
  };

  constructor(private githubService: GithubService) {}

  ngOnInit() {
    this.fetchOrganizations();
  }

  fetchOrganizations() {
    this.githubService.fetchOrganizations().subscribe(
      orgs => {
        this.organizations = orgs;
        this.fetchRepositories();
      },
      error => console.error('Error fetching organizations', error)
    );
  }

  fetchRepositories() {
    this.githubService.fetchRepositories().subscribe(
      repos => {
        this.repositories = repos;
      },
      error => console.error('Error fetching repositories', error)
    );
  }

  onInclusionChanged(event: any) {
    const repoId = event.data._id;
    const included = event.newValue;

    this.githubService.updateRepositoryInclusion(repoId, included).subscribe(
      updatedRepo => {
        console.log('Repository updated', updatedRepo);
      },
      error => console.error('Error updating repository', error)
    );
  }

  onGridReady(params: GridReadyEvent) {
    this.grid.api = params.api;
    this.grid.columnApi = params.columnApi;
  }
}