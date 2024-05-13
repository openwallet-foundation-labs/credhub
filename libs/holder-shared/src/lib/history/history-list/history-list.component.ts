import { Component, OnInit } from '@angular/core';
import { History, HistoryApiService } from '../../api/kms';
import { firstValueFrom } from 'rxjs';
import { MatListModule } from '@angular/material/list';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FlexLayoutModule } from 'ng-flex-layout';

@Component({
  selector: 'lib-history-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    FlexLayoutModule,
  ],
  templateUrl: './history-list.component.html',
  styleUrl: './history-list.component.scss',
})
export class HistoryListComponent implements OnInit {
  values: History[] = [];
  constructor(private historyApiService: HistoryApiService) {}

  async ngOnInit(): Promise<void> {
    this.values = await firstValueFrom(
      this.historyApiService.historyControllerAll()
    );
  }

  async clear() {
    if (!confirm('Are you sure you want to delete all entries?')) {
      return;
    }
    await firstValueFrom(this.historyApiService.historyControllerDelete());
    this.values = [];
  }
}
