import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { MatListModule } from '@angular/material/list';
import { AuthStateEntity, SiopApiService } from '@credhub/verifier-shared';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FlexLayoutModule } from 'ng-flex-layout';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

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
  interval!: ReturnType<typeof setInterval>;
  id!: string;
  dataSource = new MatTableDataSource<AuthStateEntity>();
  displayedColumns = ['select', 'correlationId', 'status', 'timestamp'];
  selection = new SelectionModel<AuthStateEntity>(true, []);

  constructor(
    private templatesApiService: SiopApiService,
    private route: ActivatedRoute
  ) {}
  ngOnDestroy(): void {
    clearInterval(this.interval);
  }

  async ngOnInit(): Promise<void> {
    this.id = this.route.snapshot.paramMap.get('id') as string;
    await this.loadSessions();
    //this.interval = setInterval(() => this.loadSessions(), 1000);
  }

  private loadSessions() {
    firstValueFrom(
      this.templatesApiService.siopControllerGetAllAuthRequest(this.id)
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
        this.templatesApiService.siopControllerDeleteAuthRequest(
          this.id,
          session.correlationId
        )
      );
    }
    this.loadSessions();
  }
}
