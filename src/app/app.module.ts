import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppComponent } from './app.component';
import { GitHubDataGridComponent } from './components/github-data-component';
import { IssueDetailsComponent } from './components/issue-details.component';

@NgModule({
  declarations: [
    AppComponent,
    GitHubDataGridComponent,
    IssueDetailsComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
