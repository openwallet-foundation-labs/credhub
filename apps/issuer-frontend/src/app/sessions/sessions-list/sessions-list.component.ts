import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CredentialOfferSession,
  SessionsApiService,
} from '@credhub/issuer-shared';
import { firstValueFrom } from 'rxjs';
import { MatListModule } from '@angular/material/list';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { FlexLayoutModule } from 'ng-flex-layout';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SelectionModel } from '@angular/cdk/collections';

@Component({
  selector: 'app-sessions-list',
  standalone: true,
  imports: [
    CommonModule,
    MatListModule,
    RouterModule,
    MatTableModule,
    MatCheckboxModule,
    FlexLayoutModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './sessions-list.component.html',
  styleUrl: './sessions-list.component.scss',
})
export class SessionsListComponent implements OnInit, OnDestroy {
  @Input() id?: string;

  interval!: ReturnType<typeof setInterval>;
  dataSource = new MatTableDataSource<CredentialOfferSession>();
  displayedColumns = ['select', 'correlationId', 'status', 'timestamp'];
  selection = new SelectionModel<CredentialOfferSession>(true, []);

  constructor(private sessionsApiService: SessionsApiService) {}
  ngOnDestroy(): void {
    clearInterval(this.interval);
  }

  async ngOnInit(): Promise<void> {
    this.loadSessions();
  }

  private loadSessions() {
    firstValueFrom(
      this.sessionsApiService.issuerControllerListAll(this.id)
    ).then((sessions) => (this.dataSource.data = sessions));
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected == numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  toggleAllRows() {
    this.isAllSelected()
      ? this.selection.clear()
      : this.dataSource.data.forEach((row) => this.selection.select(row));
  }

  async deleteSelected() {
    if (!confirm('Are you sure you want to delete these sessions?')) return;
    for (const session of this.selection.selected) {
      await firstValueFrom(
        this.sessionsApiService.issuerControllerDelete(session.id)
      );
      //remove the element from the data source
      const index = this.dataSource.data.indexOf(session);
      if (index > -1) {
        this.dataSource.data.splice(index, 1);
        this.dataSource.data = [...this.dataSource.data];
      }
    }
  }
}
