import { Component, OnInit } from '@angular/core';
import { History, HistoryApiService } from '../../api/kms';
import { firstValueFrom } from 'rxjs';
import { MatListModule } from '@angular/material/list';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-history-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MatListModule, MatIconModule],
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
}
