import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HistoryApiService, HistoryResponse } from '../../api/';
import { firstValueFrom } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FlexLayoutModule } from 'ng-flex-layout';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'lib-history-show',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatCardModule,
    MatButtonModule,
    MatListModule,
    FlexLayoutModule,
  ],
  templateUrl: './history-show.component.html',
  styleUrl: './history-show.component.scss',
})
export class HistoryShowComponent implements OnInit {
  element!: HistoryResponse;

  constructor(
    private route: ActivatedRoute,
    private historyApiService: HistoryApiService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) this.router.navigate(['/']);
    this.element = await firstValueFrom(
      this.historyApiService.historyControllerGetOne(id as string)
    );
  }
}
